---
type: plan
version: 1
specId: SPEC-006
approach: "Extend GovernanceContextSchema with NormalizedConstraints and add mechanical derivation in GovernanceCompiler.compile()"
fileChanges:
  - path: "src/schemas/governance.ts"
    action: modify
    description: "Add NormalizedConstraintSchema, NormalizedConstraintsSchema, and constraints field to GovernanceContextSchema"
  - path: "src/engine/GovernanceCompiler.ts"
    action: modify
    description: "Bump COMPILER_VERSION to '1.1', add private deriveConstraints() method, update compile() to populate constraints"
  - path: "tests/governance.test.ts"
    action: modify
    description: "Add constraint-specific test cases: full derivation, missing sections, deduplication, deterministic ordering, version bump staleness"
risks:
  - "GovernanceContextSchema.safeParse in readCached() will reject cached files lacking the new 'constraints' field — mitigated by the COMPILER_VERSION bump which forces recompilation before readCached() is trusted"
  - "Architecture constitution's patterns fields (style, communication, dataFlow) are optional strings in ArchConstitutionFrontmatterSchema — deriveConstraints must guard for undefined/null"
  - "Boundaries array entries may have varying shapes — must only use boundary.name as per the spec derivation mapping"
dependencies: []
codebaseAnalysis:
  existingCode:
    - "src/schemas/governance.ts: GovernanceContextSchema (z.object with 7 fields), CompilationWarning — extend in place"
    - "src/engine/GovernanceCompiler.ts: COMPILER_VERSION='1.0', compile() returns GovernanceContext, tryLoadSection() handles missing/malformed files — add deriveConstraints() as private method"
    - "src/schemas/constitution.ts: DevConstitutionFrontmatterSchema has stack.{languages,frameworks,databases,infrastructure}[], agentRules[], conventions.codeStyle[]; ArchConstitutionFrontmatterSchema has patterns.{style?,communication?,dataFlow?}, boundaries[]{name}"
    - "src/schemas/gates.ts: SecurityPrinciplesFrontmatterSchema has policies.{authentication[],dataHandling[],networking[]}, owaspAlignment[]"
    - "tests/governance.test.ts: 21 tests using tmp dir pattern; devData fixture has stack.languages=['TypeScript'], agentRules=['SPEC IS TRUTH']; securityData has policies.authentication=['OAuth2'], dataHandling=['Encrypt at rest'], networking=['TLS'], owaspAlignment=['A01:2021']; archData has patterns.style='modular-monolith', boundaries=[]"
  reusableModules:
    - "Existing GovernanceContext section references (development, architecture, security) available directly in compile() — no new loading needed"
    - "Existing tmp dir fixture setup (writeAllGovernanceFiles) in tests reusable for constraint tests"
    - "z.infer<> pattern already established — NormalizedConstraint/NormalizedConstraints types come free from schemas"
  patternsToFollow:
    - "Zod schema as source of truth: define NormalizedConstraintSchema/NormalizedConstraintsSchema in governance.ts, export z.infer<> types"
    - "Strict TypeScript: no 'any', all types inferred from Zod"
    - "Deduplication: filter by rule string, keep first occurrence's source (Array.filter with Set)"
    - "Deterministic sort: localeCompare on category then rule"
    - "Guard pattern for optional fields: use ?? [] or optional chaining"
updatedAt: "2026-03-28T00:00:00.000Z"
---

# Plan: SPEC-006 — Normalized Constraints Layer

## Approach

Purely additive extension of SPEC-005 artifacts. No new files, no CLI changes, no new dependencies. The work spans exactly 3 files:

1. **`src/schemas/governance.ts`** — add two new Zod schemas and extend `GovernanceContextSchema`
2. **`src/engine/GovernanceCompiler.ts`** — bump version, implement mechanical derivation
3. **`tests/governance.test.ts`** — extend the existing test suite with constraint-specific cases

## Codebase Analysis

### What already exists

- `GovernanceContextSchema` in `src/schemas/governance.ts` is a clean `z.object` — adding `constraints` is a one-line addition
- `compile()` already resolves `development`, `architecture`, and `security` sections — `deriveConstraints()` receives these as arguments
- `isStale()` already compares `cached.version !== COMPILER_VERSION` — bumping the constant is the entire recompilation trigger
- Test fixtures (`devData`, `archData`, `securityData`) already cover the fields that will be derived into constraints

### What needs to be built

- `NormalizedConstraintSchema = z.object({ category, rule, source })`
- `NormalizedConstraintsSchema = z.object({ tech, code, architecture, security })` (each an array)
- `deriveConstraints(development, architecture, security)` private method:
  - tech: `[...stack.languages, ...stack.frameworks, ...stack.databases, ...stack.infrastructure]` from `development`
  - code: `[...agentRules, ...conventions.codeStyle]` from `development`
  - architecture: `[patterns.style, patterns.communication, patterns.dataFlow].filter(Boolean)` + `boundaries.map(b => b.name)` from `architecture`
  - security: `[...policies.authentication, ...policies.dataHandling, ...policies.networking, ...owaspAlignment]` from `security`
  - Deduplicate across all: within each category, filter by rule using a Set
  - Sort each category array by rule alphabetically

## File Changes

### 1. `src/schemas/governance.ts` — MODIFY

Add before `GovernanceContextSchema`:

```typescript
export const NormalizedConstraintSchema = z.object({
  category: z.enum(["tech", "code", "architecture", "security"]),
  rule: z.string(),
  source: z.string(),
});
export type NormalizedConstraint = z.infer<typeof NormalizedConstraintSchema>;

export const NormalizedConstraintsSchema = z.object({
  tech: z.array(NormalizedConstraintSchema),
  code: z.array(NormalizedConstraintSchema),
  architecture: z.array(NormalizedConstraintSchema),
  security: z.array(NormalizedConstraintSchema),
});
export type NormalizedConstraints = z.infer<typeof NormalizedConstraintsSchema>;
```

Extend `GovernanceContextSchema` with:
```typescript
constraints: NormalizedConstraintsSchema,
```

### 2. `src/engine/GovernanceCompiler.ts` — MODIFY

- Bump `COMPILER_VERSION` from `"1.0"` to `"1.1"`
- Import `NormalizedConstraints`, `NormalizedConstraint` from `../schemas/governance.js`
- Add private `deriveConstraints()` method (takes nullable development/architecture/security, returns `NormalizedConstraints`)
- Update `compile()` to call `deriveConstraints(development, architecture, security)` and include result in returned object

**`deriveConstraints()` logic:**

```typescript
private deriveConstraints(
  development: DevConstitutionFrontmatter | null | undefined,
  architecture: ArchConstitutionFrontmatter | null | undefined,
  security: SecurityPrinciplesFrontmatter | null | undefined
): NormalizedConstraints {
  const raw: NormalizedConstraint[] = [];

  // tech
  if (development) {
    for (const rule of [...development.stack.languages, ...development.stack.frameworks, ...development.stack.databases, ...development.stack.infrastructure]) {
      raw.push({ category: "tech", rule, source: "development.stack" });
    }
  }

  // code
  if (development) {
    for (const rule of development.agentRules) raw.push({ category: "code", rule, source: "development.agentRules" });
    for (const rule of development.conventions.codeStyle) raw.push({ category: "code", rule, source: "development.conventions.codeStyle" });
  }

  // architecture
  if (architecture) {
    if (architecture.patterns.style) raw.push({ category: "architecture", rule: architecture.patterns.style, source: "architecture.patterns.style" });
    if (architecture.patterns.communication) raw.push({ category: "architecture", rule: architecture.patterns.communication, source: "architecture.patterns.communication" });
    if (architecture.patterns.dataFlow) raw.push({ category: "architecture", rule: architecture.patterns.dataFlow, source: "architecture.patterns.dataFlow" });
    for (const b of architecture.boundaries) raw.push({ category: "architecture", rule: b.name, source: "architecture.boundaries" });
  }

  // security
  if (security) {
    for (const rule of security.policies.authentication) raw.push({ category: "security", rule, source: "security.policies.authentication" });
    for (const rule of security.policies.dataHandling) raw.push({ category: "security", rule, source: "security.policies.dataHandling" });
    for (const rule of security.policies.networking) raw.push({ category: "security", rule, source: "security.policies.networking" });
    for (const rule of security.owaspAlignment) raw.push({ category: "security", rule, source: "security.owaspAlignment" });
  }

  // Deduplicate by rule within each category (keep first occurrence)
  const seen = new Set<string>();
  const deduped = raw.filter(c => {
    const key = `${c.category}:${c.rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: category alpha, then rule alpha within category
  deduped.sort((a, b) => a.category.localeCompare(b.category) || a.rule.localeCompare(b.rule));

  return {
    tech: deduped.filter(c => c.category === "tech"),
    code: deduped.filter(c => c.category === "code"),
    architecture: deduped.filter(c => c.category === "architecture"),
    security: deduped.filter(c => c.category === "security"),
  };
}
```

### 3. `tests/governance.test.ts` — MODIFY

Add a new `describe("constraints derivation")` block inside the existing `describe("GovernanceCompiler")` block with these test cases:

- **Full governance → all four categories populated** using `writeAllGovernanceFiles` + `compile()`, assert `ctx.constraints.tech`, `.code`, `.architecture`, `.security` each have the expected rules
- **Missing sections → empty arrays for those categories** (e.g., no security file → `ctx.constraints.security` is `[]`)
- **All sections missing → all empty arrays** and `ctx.constraints` is defined (never null)
- **Deduplication** — write a governance file with a duplicate rule in two sources, assert it appears only once
- **Deterministic ordering** — assert sorted order holds (category alpha, rule alpha)
- **COMPILER_VERSION is `"1.1"`** — verify `COMPILER_VERSION === "1.1"`
- **Version bump triggers staleness** — write a context with version `"1.0"`, assert `isStale()` returns `true`

## Risks

1. **`safeParse` rejection on old cache**: `readCached()` uses `GovernanceContextSchema.safeParse()` — a cached file from SPEC-005 (`version: "1.0"`) lacks `constraints` and will fail parse, returning `null`. This is safe: `ensureGovernanceContext()` falls through to recompile. No action needed beyond the version bump.

2. **Optional `patterns` fields**: `ArchConstitutionFrontmatterSchema` defines `patterns.style`, `.communication`, `.dataFlow` as optional strings. `deriveConstraints()` guards each with `if (architecture.patterns.style)` before pushing.

3. **No `communication`/`dataFlow` in fixture**: The existing `archData` fixture only sets `patterns.style`. The new tests either use that fixture or extend it — no fixture changes needed for the core test, just additional fixtures for ordering/dedup tests.

## Architecture Fit

- `NormalizedConstraints` is always populated in `GovernanceContext` (never `null`), consistent with the spec constraint
- The `constraints` field is last in `GovernanceContextSchema`, maintaining backward read-compatibility (Zod strips unknown fields, adding a new required field in a new version is gated by the `COMPILER_VERSION` bump)
- `deriveConstraints()` is a pure function (no I/O, no side effects) — testable in isolation but called from `compile()` for integration
