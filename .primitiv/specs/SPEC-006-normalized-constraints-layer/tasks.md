---
type: tasks
version: 1
specId: SPEC-006
tasks:
  - id: TASK-001
    title: "Add NormalizedConstraints schemas to governance.ts"
    description: "Define NormalizedConstraintSchema and NormalizedConstraintsSchema in src/schemas/governance.ts, and add the constraints field to GovernanceContextSchema."
    status: completed
    files:
      - "src/schemas/governance.ts"
    acceptanceCriteria:
      - "NormalizedConstraintSchema is exported: z.object({ category: z.enum(['tech','code','architecture','security']), rule: z.string(), source: z.string() })"
      - "NormalizedConstraintsSchema is exported: z.object({ tech, code, architecture, security }) each z.array(NormalizedConstraintSchema)"
      - "NormalizedConstraint and NormalizedConstraints types are exported via z.infer<>"
      - "GovernanceContextSchema includes constraints: NormalizedConstraintsSchema (non-nullable)"
      - "TypeScript strict mode passes — no 'any', no type errors"
      - "Existing GovernanceContext fields are unchanged"
    dependsOn: []

  - id: TASK-002
    title: "Implement deriveConstraints() and bump COMPILER_VERSION in GovernanceCompiler.ts"
    description: "Bump COMPILER_VERSION from '1.0' to '1.1', add private deriveConstraints() method that mechanically maps governance sections to NormalizedConstraints, and update compile() to include constraints in the returned context."
    status: completed
    files:
      - "src/engine/GovernanceCompiler.ts"
    acceptanceCriteria:
      - "COMPILER_VERSION is '1.1'"
      - "compile() returns a GovernanceContext with a populated constraints field"
      - "tech constraints derived from development.stack.{languages,frameworks,databases,infrastructure}"
      - "code constraints derived from development.agentRules and development.conventions.codeStyle"
      - "architecture constraints derived from architecture.patterns.{style,communication,dataFlow} (undefined-guarded) and architecture.boundaries[].name"
      - "security constraints derived from security.policies.{authentication,dataHandling,networking} and security.owaspAlignment"
      - "Missing governance sections contribute empty arrays — no error thrown"
      - "Constraints are deduplicated by rule within each category (first-occurrence source kept)"
      - "Constraints are sorted: category alphabetically, then rule alphabetically within category"
      - "constraints is always present in returned context (never undefined)"
      - "TypeScript strict mode passes — no 'any', imports use NormalizedConstraints type from governance.ts"
    dependsOn: ["TASK-001"]

  - id: TASK-003
    title: "Add constraint test cases to governance.test.ts"
    description: "Extend the existing GovernanceCompiler test suite with a constraints derivation describe block covering: full derivation, missing sections, deduplication, deterministic ordering, and COMPILER_VERSION bump."
    status: completed
    files:
      - "tests/governance.test.ts"
    acceptanceCriteria:
      - "Test: constraints.tech includes 'TypeScript' when devData.stack.languages=['TypeScript']"
      - "Test: constraints.code includes 'SPEC IS TRUTH' from agentRules"
      - "Test: constraints.architecture includes 'modular-monolith' from archData.patterns.style"
      - "Test: constraints.security includes 'OAuth2', 'Encrypt at rest', 'TLS', 'A01:2021'"
      - "Test: constraints.security is [] when security governance file is absent"
      - "Test: all four categories are empty arrays when no governance files exist"
      - "Test: duplicate rule appearing in two sources produces only one constraint entry"
      - "Test: constraints within each category are alphabetically sorted by rule"
      - "Test: COMPILER_VERSION === '1.1'"
      - "Test: isStale() returns true for a cached context with version '1.0'"
      - "All new tests pass with vitest run"
    dependsOn: ["TASK-002"]
updatedAt: "2026-03-28T01:00:00.000Z"
---

# Tasks: SPEC-006 — Normalized Constraints Layer

## TASK-001 — Add NormalizedConstraints schemas to governance.ts

**Files:** `src/schemas/governance.ts`
**Depends on:** nothing

Define `NormalizedConstraintSchema` and `NormalizedConstraintsSchema` using Zod, export `z.infer<>` types, and add a required `constraints: NormalizedConstraintsSchema` field to `GovernanceContextSchema`.

**Acceptance Criteria:**
- `NormalizedConstraintSchema` exported: `z.object({ category: z.enum(['tech','code','architecture','security']), rule: z.string(), source: z.string() })`
- `NormalizedConstraintsSchema` exported: `z.object({ tech, code, architecture, security })` each `z.array(NormalizedConstraintSchema)`
- `NormalizedConstraint` and `NormalizedConstraints` types exported via `z.infer<>`
- `GovernanceContextSchema` includes `constraints: NormalizedConstraintsSchema` (non-nullable)
- TypeScript strict mode passes — no `any`, no type errors
- Existing `GovernanceContext` fields unchanged

---

## TASK-002 — Implement deriveConstraints() and bump COMPILER_VERSION

**Files:** `src/engine/GovernanceCompiler.ts`
**Depends on:** TASK-001

Bump `COMPILER_VERSION` from `"1.0"` to `"1.1"`. Add private `deriveConstraints(development, architecture, security)` method that mechanically maps governance section arrays to `NormalizedConstraints`. Update `compile()` to call it and include the result in the returned context.

**Derivation mapping:**
| Source | Category |
|--------|----------|
| `development.stack.{languages,frameworks,databases,infrastructure}` | `tech` |
| `development.agentRules` | `code` |
| `development.conventions.codeStyle` | `code` |
| `architecture.patterns.{style,communication,dataFlow}` (string, optional) | `architecture` |
| `architecture.boundaries[].name` | `architecture` |
| `security.policies.{authentication,dataHandling,networking}` | `security` |
| `security.owaspAlignment` | `security` |

Post-processing: deduplicate by `rule` within each category (keep first occurrence's `source`); sort by category alphabetically then rule alphabetically.

**Acceptance Criteria:**
- `COMPILER_VERSION` is `"1.1"`
- `compile()` returns context with populated `constraints` field
- All derivation mappings implemented as specified
- Missing sections → empty arrays, no error
- Deduplication and sorting applied
- `constraints` always present (never `undefined`)
- TypeScript strict mode passes

---

## TASK-003 — Add constraint test cases to governance.test.ts

**Files:** `tests/governance.test.ts`
**Depends on:** TASK-002

Add a new `describe("constraints derivation")` block inside the existing `describe("GovernanceCompiler")` suite. Tests use the existing tmp dir pattern and fixtures.

**Acceptance Criteria:**
- `constraints.tech` includes `'TypeScript'` from `devData.stack.languages`
- `constraints.code` includes `'SPEC IS TRUTH'` from `devData.agentRules`
- `constraints.architecture` includes `'modular-monolith'` from `archData.patterns.style`
- `constraints.security` includes `'OAuth2'`, `'Encrypt at rest'`, `'TLS'`, `'A01:2021'`
- `constraints.security` is `[]` when security file absent
- All four category arrays are `[]` when no governance files exist
- Duplicate rule in two sources → single constraint entry
- Constraints within each category sorted alphabetically by rule
- `COMPILER_VERSION === "1.1"`
- `isStale()` returns `true` for cached context with `version: "1.0"`
- All new tests pass with `vitest run`
