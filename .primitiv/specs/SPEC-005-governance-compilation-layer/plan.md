---
type: plan
version: 1
specId: SPEC-005
approach: "Add GovernanceCompiler engine class that compiles YAML frontmatter from all governance files into a typed, cached GovernanceContext JSON, injected into downstream agent prompts"
fileChanges:
  - path: "src/schemas/governance.ts"
    action: create
    description: "GovernanceContextSchema (Zod), CompilationWarningSchema, and exported TypeScript types"
  - path: "src/schemas/gates.ts"
    action: modify
    description: "Add operatingPrinciples field to CompanyPrinciplesFrontmatterSchema (missing from schema but present in YAML)"
  - path: "src/schemas/constitution.ts"
    action: modify
    description: "Add modules and lifecycleStates fields to ProductConstitutionFrontmatterSchema (present in YAML but stripped by Zod)"
  - path: "src/engine/GovernanceCompiler.ts"
    action: create
    description: "GovernanceCompiler class with compile(), readCached(), isStale(), write(), ensureGitignored(); exported ensureGovernanceContext() function"
  - path: "src/commands/compile.ts"
    action: create
    description: "runCompile() CLI command handler — compiles and writes context, prints warnings and summary"
  - path: "src/cli.ts"
    action: modify
    description: "Register 'primitiv compile' command using runCompile()"
  - path: "src/engine/PrimitivEngine.ts"
    action: modify
    description: "Add compiler: GovernanceCompiler property; expose compile() and ensureGovernanceContext() facade methods"
  - path: "src/init/templates.ts"
    action: modify
    description: "Add 'primitiv.compile.md' to getCommandTemplateNames() list"
  - path: "src/index.ts"
    action: modify
    description: "Export GovernanceCompiler, GovernanceContext type, GovernanceContextSchema, ensureGovernanceContext from new modules"
  - path: "templates/commands/primitiv.compile.md"
    action: create
    description: "Slash command template for /primitiv.compile — run compiler, display result, warn on missing sections"
  - path: "templates/commands/primitiv.plan.md"
    action: modify
    description: "Step 1: read .primitiv/governance-context.json and inject as structured JSON block into plan agent context instead of re-reading raw markdown"
  - path: "templates/commands/primitiv.tasks.md"
    action: modify
    description: "Add governance context pre-flight: read .primitiv/governance-context.json and inject into task breakdown context"
  - path: "templates/commands/primitiv.implement.md"
    action: modify
    description: "Update subagent prompt template to include full GovernanceContext JSON block; add pre-flight step"
  - path: "tests/governance.test.ts"
    action: create
    description: "Vitest unit tests for GovernanceCompiler: parsing each governance file type, full context production, staleness detection (hash + version), missing-file warnings, malformed YAML errors"
risks:
  - "YAML frontmatter stripping: Zod's z.object() strips unknown fields by default — must explicitly add missing fields (operatingPrinciples, modules, lifecycleStates) to schemas before compilation or those fields will be silently dropped from the context"
  - "SHA-256 hash ordering: to ensure determinism, input files must be hashed in a stable, alphabetically-sorted order; if hash order is non-deterministic, every run will recompile unnecessarily"
  - "Circular import risk: GovernanceCompiler imports GateManager and ConstitutionManager; PrimitivEngine imports GovernanceCompiler — no circular dependency exists but must be verified"
  - "Template injection size: injecting the full GovernanceContext into every agent prompt adds ~800-1200 tokens per invocation; acceptable for now but could become costly at scale"
  - "gitignore path: .primitiv/.gitignore inside a tracked directory correctly gitignores governance-context.json — must verify git honors inner .gitignore files (it does)"
dependencies: []
codebaseAnalysis:
  existingCode:
    - "GateManager (src/engine/GateManager.ts) — already reads and Zod-parses company/security files; GovernanceCompiler wraps it"
    - "ConstitutionManager (src/engine/ConstitutionManager.ts) — already reads and Zod-parses product/dev/arch files; GovernanceCompiler wraps it"
    - "parseDocument (src/utils/frontmatter.ts) — gray-matter + Zod parsing; reused directly"
    - "readPrimitivFile/writePrimitivFile/primitivFileExists (src/utils/fileSystem.ts) — reused for all file I/O"
    - "PrimitivEngine.getProjectContext() — already assembles governance data as Record<string,unknown>; GovernanceCompiler is a typed, versioned, cached evolution of this pattern"
    - "CompanyPrinciplesFrontmatterSchema, SecurityPrinciplesFrontmatterSchema (src/schemas/gates.ts) — reused as sub-schemas of GovernanceContextSchema"
    - "ProductConstitutionFrontmatterSchema, DevConstitutionFrontmatterSchema, ArchConstitutionFrontmatterSchema (src/schemas/constitution.ts) — same"
    - "PrimitivError pattern (src/utils/errors.ts) — GovernanceCompilationError follows the same subclass pattern"
    - "chalk (already in dependencies) — used for CLI output formatting"
    - "Commander.js (src/cli.ts) — existing CLI framework; add one new .command('compile')"
    - "Vitest + tmp dir test pattern (tests/gateValidation.test.ts) — exact same setup/teardown pattern used in governance tests"
  reusableModules:
    - "GateManager and ConstitutionManager — called directly from GovernanceCompiler, no duplication"
    - "parseDocument from frontmatter.ts — no new YAML parsing code needed"
    - "writePrimitivFile from fileSystem.ts — used to write governance-context.json"
    - "FrontmatterBaseSchema from schemas/common.ts — base for GovernanceContextSchema"
    - "loadTemplate from init/templates.ts — compile template loaded the same way as other templates"
  patternsToFollow:
    - "Engine class constructor receives projectRoot: string, all file paths resolved relative to it (GateManager, ConstitutionManager, SpecManager)"
    - "Zod schema in src/schemas/ + type exported as z.infer<typeof Schema> — all existing schemas follow this"
    - "PrimitivError subclass: constructor(message, code) pattern from errors.ts"
    - "CLI commands: runXxx(targetDir, ...) functions in src/commands/ registered in cli.ts via program.command()"
    - "Tests use tmp dir with beforeEach/afterEach cleanup; writePrimitivFile + serializeDocument to write test fixtures"
    - "Template files in templates/commands/ — markdown with YAML frontmatter describing the slash command"
updatedAt: "2026-03-28T00:00:00.000Z"
---

# Implementation Plan — SPEC-005: Governance Compilation Layer

## 1. Approach

Build a `GovernanceCompiler` engine class that:
1. Reads all 5 governance files via existing `GateManager` and `ConstitutionManager`
2. Computes a SHA-256 hash of all input file contents for staleness detection
3. Produces a typed `GovernanceContext` object validated by a Zod schema
4. Writes the context to `.primitiv/governance-context.json` and gitignores it
5. Exposes `ensureGovernanceContext()` for downstream pre-flight use

A new `primitiv compile` CLI command surfaces this for explicit user invocation. Downstream slash command templates (plan, tasks, implement) are updated to read the compiled context and inject it as a structured JSON block into agent prompts.

---

## 2. Codebase Analysis

### What exists and can be reused

The codebase has almost everything needed. Key findings:

- **`GateManager`** (`src/engine/GateManager.ts`) and **`ConstitutionManager`** (`src/engine/ConstitutionManager.ts`) already do the heavy lifting of reading and Zod-parsing governance files. `GovernanceCompiler` simply wraps them, calling their existing methods in try/catch to handle missing files gracefully.

- **All 5 Zod schemas** for governance file types already exist (`src/schemas/gates.ts`, `src/schemas/constitution.ts`). They are complete except for 3 missing fields that are present in real governance files but silently stripped by Zod's default `strip` mode:
  - `operatingPrinciples` in `CompanyPrinciplesFrontmatterSchema` (gates.ts)
  - `modules` in `ProductConstitutionFrontmatterSchema` (constitution.ts)
  - `lifecycleStates` in `ProductConstitutionFrontmatterSchema` (constitution.ts)

- **`PrimitivEngine.getProjectContext()`** already assembles all governance data in try/catch with graceful handling. `GovernanceCompiler` is a typed, versioned, hashed evolution of this exact pattern.

- **`parseDocument`** from `frontmatter.ts` uses `gray-matter` for YAML frontmatter parsing. No new parsing code is needed.

- **CLI** (`cli.ts`) uses Commander.js. Adding a `compile` command is one `program.command()` call.

- **Test pattern** from `tests/gateValidation.test.ts` uses `tmpdir()` + `beforeEach`/`afterEach` cleanup + `writePrimitivFile`/`serializeDocument` fixtures — identical pattern for governance tests.

- **Error class pattern** from `errors.ts`: add `GovernanceCompilationError` following the same `PrimitivError` subclass structure.

### Schema gaps to fix

Before implementing `GovernanceCompiler`, 3 schema fields need to be added (backward-compatible, all with `default([])`):

| Schema | Field | Type |
|---|---|---|
| `CompanyPrinciplesFrontmatterSchema` | `operatingPrinciples` | `z.array(z.string())` |
| `ProductConstitutionFrontmatterSchema` | `modules` | `z.array(z.object({name, description?}))` |
| `ProductConstitutionFrontmatterSchema` | `lifecycleStates` | `z.array(z.string())` |

---

## 3. File Changes

### A) New: `src/schemas/governance.ts`

Define `CompilationWarningSchema` and `GovernanceContextSchema` composing the existing 5 frontmatter schemas as nullable fields:

```typescript
export const GovernanceContextSchema = z.object({
  version: z.string(),
  compiledAt: z.string(),
  sourceHash: z.string(),
  company: CompanyPrinciplesFrontmatterSchema.nullable(),
  security: SecurityPrinciplesFrontmatterSchema.nullable(),
  product: ProductConstitutionFrontmatterSchema.nullable(),
  development: DevConstitutionFrontmatterSchema.nullable(),
  architecture: ArchConstitutionFrontmatterSchema.nullable(),
  warnings: z.array(CompilationWarningSchema),
});
export type GovernanceContext = z.infer<typeof GovernanceContextSchema>;
```

### B) Modified: `src/schemas/gates.ts`

Add `operatingPrinciples: z.array(z.string()).default([])` to `CompanyPrinciplesFrontmatterSchema`.

### C) Modified: `src/schemas/constitution.ts`

Add to `ProductConstitutionFrontmatterSchema`:
- `modules: z.array(z.object({ name: z.string(), description: z.string().optional() })).default([])`
- `lifecycleStates: z.array(z.string()).default([])`

### D) New: `src/engine/GovernanceCompiler.ts`

Core logic:

```typescript
export const COMPILER_VERSION = "1.0";

export class GovernanceCompiler {
  constructor(private projectRoot: string) {}

  compile(): GovernanceContext
  // Calls GateManager + ConstitutionManager in try/catch
  // Collects warnings for missing sections
  // Computes sourceHash over sorted file contents
  // Returns validated GovernanceContext

  readCached(): GovernanceContext | null
  // Reads .primitiv/governance-context.json
  // Validates with GovernanceContextSchema.safeParse()
  // Returns null if missing or unparseable

  isStale(cached: GovernanceContext): boolean
  // Returns true if cached.version !== COMPILER_VERSION
  //    OR cached.sourceHash !== computeCurrentHash()

  write(context: GovernanceContext): void
  // Writes to .primitiv/governance-context.json
  // Calls ensureGitignored() on first write

  private computeSourceHash(): string
  // Reads all governance file contents that exist, sorted alphabetically by path
  // SHA-256 of their concatenated contents

  private ensureGitignored(): void
  // Adds governance-context.json to .primitiv/.gitignore if not present
}

export function ensureGovernanceContext(
  projectRoot: string
): { context: GovernanceContext; recompiled: boolean; notices: string[] }
// Orchestrates: readCached → isStale check → recompile if needed → return
```

**Staleness logic:**
1. If no cached file → compile fresh, no notice
2. If cached version ≠ `COMPILER_VERSION` → recompile, notice: `⟳ Schema updated (v1.0 → vX.X), recompiling governance context...`
3. If sourceHash differs → recompile, notice: `⟳ Governance files changed, recompiling context...`
4. Otherwise → return cached as-is

**gitignore logic:**
- Target file: `.primitiv/.gitignore`
- Appends `governance-context.json` line if not already present

### E) New: `src/commands/compile.ts`

```typescript
export async function runCompile(projectRoot: string): Promise<void>
// Creates GovernanceCompiler, calls compile() + write()
// Displays: section presence (✓/⚠), warnings, hash prefix, output path
```

### F) Modified: `src/cli.ts`

Register `primitiv compile`:
```typescript
program
  .command("compile")
  .description("Compile governance files into a structured context")
  .action(async () => { await runCompile(resolve(".")); });
```

### G) Modified: `src/engine/PrimitivEngine.ts`

Add `compiler: GovernanceCompiler` property, expose `compile()` and `ensureGovernanceContext()` facade methods on the engine.

### H) Modified: `src/init/templates.ts`

Add `"primitiv.compile.md"` to `getCommandTemplateNames()` array.

### I) Modified: `src/index.ts`

Export `GovernanceCompiler`, `ensureGovernanceContext`, `GovernanceContextSchema`, `CompilationWarningSchema`, and types from the new modules.

### J) New: `templates/commands/primitiv.compile.md`

Slash command template. Instructions for Claude to:
1. Run `primitiv compile` (or call `GovernanceCompiler` via the SDK)
2. Display compilation results: sections found, warnings, hash, output path
3. Suggest next step: `/primitiv.plan` or other downstream command

### K) Modified: `templates/commands/primitiv.plan.md`

**Change in Step 1** — replace "read gates and constitutions" with:
```
1. Check if `.primitiv/governance-context.json` exists
   - If YES: read it — this is the compiled GovernanceContext (JSON)
   - If NO: warn "Run `primitiv compile` first for consistent governance context."
             Then fall back to reading governance markdown files directly.
2. Include the full GovernanceContext JSON as a structured block at the top of your working context:
   ## Governance Context
   ```json
   { <full governance-context.json contents> }
   ```
```

### L) Modified: `templates/commands/primitiv.tasks.md`

Same governance pre-flight as K, injected at the start of Step 1.

### M) Modified: `templates/commands/primitiv.implement.md`

**Update subagent prompt template** (Phase 3B) to include:
```
## Governance Context
```json
{ <full governance-context.json contents passed to subagent> }
```
```
Added alongside the existing "Dev constitution" and "Architecture" context lines.

Also add pre-flight in Phase 1 to load governance context.

### N) New: `tests/governance.test.ts`

Test coverage (using tmp dir pattern from `tests/gateValidation.test.ts`):

| Test | What it checks |
|---|---|
| `compile() with all governance files` | Returns valid GovernanceContext with all 5 sections non-null |
| `compile() with missing security file` | Returns context with `security: null`, warnings includes message |
| `compile() with no governance files at all` | Returns context with all sections null, 5 warnings |
| `compile() with malformed YAML frontmatter` | Throws GovernanceCompilationError identifying the file |
| `sourceHash is deterministic` | Two compile() calls on same files return identical hash |
| `isStale() — version mismatch` | Returns true when cached.version !== COMPILER_VERSION |
| `isStale() — hash mismatch` | Returns true when a governance file is modified |
| `isStale() — fresh cache` | Returns false when version matches and files unchanged |
| `write() creates .primitiv/.gitignore` | gitignore file created with governance-context.json entry |
| `write() does not duplicate gitignore entry` | Calling write() twice does not add duplicate entry |
| `ensureGovernanceContext() — no cache` | Compiles fresh, recompiled=false |
| `ensureGovernanceContext() — stale cache` | Recompiles, recompiled=true, includes notice |
| `ensureGovernanceContext() — fresh cache` | Returns cached, recompiled=false |
| `CompanyPrinciplesFrontmatterSchema` | operatingPrinciples field is parsed and preserved |
| `ProductConstitutionFrontmatterSchema` | modules and lifecycleStates fields are parsed and preserved |

---

## 4. Architecture Fit

`GovernanceCompiler` follows the identical engine class pattern:

```
src/engine/
  GateManager.ts           (reads gates/*)
  ConstitutionManager.ts   (reads constitutions/*)
  GovernanceCompiler.ts    (NEW — aggregates both + adds cache/hash/gitignore)
  PrimitivEngine.ts        (facade — exposes all managers + compiler)
```

No new external dependencies required. `node:crypto` (SHA-256) is a built-in Node.js module. `gray-matter` and `zod` are already in `dependencies`.

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| Zod strips unknown YAML fields | Fix schemas (gates.ts, constitution.ts) before wiring compiler — tests will catch any remaining gaps |
| Hash non-determinism | Sort file paths alphabetically before hashing; use a stable concatenation order |
| Circular import | GovernanceCompiler → GateManager/ConstitutionManager → schemas. PrimitivEngine → GovernanceCompiler. No cycle. |
| Prompt token cost | Full context ≈ 800–1200 tokens per downstream invocation. Acceptable at current scale. |
| gitignore path | `.primitiv/.gitignore` is honored by git inside a tracked directory. Verified behavior. |

---

## 6. Dependencies

None. All required libraries (`gray-matter`, `zod`, `chalk`, `commander`, `node:crypto`, `node:fs`) are already in `package.json`.
