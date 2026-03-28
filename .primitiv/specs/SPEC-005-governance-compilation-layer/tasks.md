---
type: tasks
version: 1
specId: SPEC-005
tasks:
  - id: TASK-001
    title: "Schema layer — fix schema gaps and create GovernanceContextSchema"
    description: "Add three missing YAML fields to existing Zod schemas (operatingPrinciples to CompanyPrinciplesFrontmatterSchema, modules and lifecycleStates to ProductConstitutionFrontmatterSchema). Then create src/schemas/governance.ts with CompilationWarningSchema and GovernanceContextSchema composing all five existing frontmatter schemas as nullable fields."
    status: completed
    files:
      - "src/schemas/gates.ts"
      - "src/schemas/constitution.ts"
      - "src/schemas/governance.ts"
    acceptanceCriteria:
      - "CompanyPrinciplesFrontmatterSchema includes operatingPrinciples: z.array(z.string()).default([])"
      - "ProductConstitutionFrontmatterSchema includes modules: z.array(z.object({ name: z.string(), description: z.string().optional() })).default([])"
      - "ProductConstitutionFrontmatterSchema includes lifecycleStates: z.array(z.string()).default([])"
      - "src/schemas/governance.ts exports CompilationWarningSchema with { level: 'warn', message: string, source?: string }"
      - "src/schemas/governance.ts exports GovernanceContextSchema with fields: version, compiledAt, sourceHash, company (nullable), security (nullable), product (nullable), development (nullable), architecture (nullable), warnings"
      - "src/schemas/governance.ts exports GovernanceContext and CompilationWarning TypeScript types via z.infer<>"
      - "All existing schema tests in tests/schemas.test.ts continue to pass (no regressions)"
    dependsOn: []

  - id: TASK-002
    title: "GovernanceCompiler engine class"
    description: "Create src/engine/GovernanceCompiler.ts implementing the GovernanceCompiler class and the exported ensureGovernanceContext() function. Add GovernanceCompilationError to src/utils/errors.ts. The compiler wraps GateManager and ConstitutionManager in try/catch for graceful partial-governance handling, computes a deterministic SHA-256 sourceHash over sorted file contents, detects staleness by version and hash, writes governance-context.json, and manages .primitiv/.gitignore."
    status: completed
    files:
      - "src/engine/GovernanceCompiler.ts"
      - "src/utils/errors.ts"
    acceptanceCriteria:
      - "COMPILER_VERSION constant exported as '1.0'"
      - "GovernanceCompiler constructor accepts projectRoot: string"
      - "compile() reads all 5 governance files via GateManager/ConstitutionManager, wraps each in try/catch — missing files produce null section + CompilationWarning (not a throw)"
      - "compile() throws GovernanceCompilationError (with file name in message) on malformed YAML frontmatter"
      - "compile() computes sourceHash as SHA-256 of all existing governance file contents concatenated in alphabetically-sorted file path order"
      - "readCached() reads .primitiv/governance-context.json, validates with GovernanceContextSchema.safeParse(), returns null if missing or invalid"
      - "isStale(cached) returns true when cached.version !== COMPILER_VERSION OR cached.sourceHash !== current hash"
      - "isStale(cached) returns false when version matches and hash matches"
      - "write(context) writes JSON to .primitiv/governance-context.json and calls ensureGitignored()"
      - "ensureGitignored() creates .primitiv/.gitignore with 'governance-context.json' entry if not present; does not duplicate the entry on repeated calls"
      - "ensureGovernanceContext(projectRoot) returns { context, recompiled: false, notices: [] } on first compile (no cache)"
      - "ensureGovernanceContext(projectRoot) returns { context, recompiled: true, notices: [string] } with a visible notice when cache is stale"
      - "ensureGovernanceContext(projectRoot) returns { context, recompiled: false, notices: [] } when cache is fresh"
      - "GovernanceCompilationError extends PrimitivError with code 'GOVERNANCE_COMPILATION_FAILED'"
      - "No any types, no @ts-ignore, strict TypeScript"
    dependsOn:
      - "TASK-001"

  - id: TASK-003
    title: "CLI integration — compile command, PrimitivEngine facade, SDK exports"
    description: "Wire GovernanceCompiler into the CLI and SDK surface. Create src/commands/compile.ts with runCompile() that compiles, displays section presence (✓/⚠ per section), warnings, hash prefix, and output path. Register 'primitiv compile' in src/cli.ts. Add compiler property and compile()/ensureGovernanceContext() facade methods to PrimitivEngine. Export all new types and classes from src/index.ts."
    status: completed
    files:
      - "src/commands/compile.ts"
      - "src/cli.ts"
      - "src/engine/PrimitivEngine.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "src/commands/compile.ts exports async runCompile(projectRoot: string): Promise<void>"
      - "runCompile() creates GovernanceCompiler, calls compile() + write(), prints section summary (✓ company, ✓ security, etc. or ⚠ <section> not found)"
      - "runCompile() prints all compilation warnings with ⚠ prefix"
      - "runCompile() prints hash prefix (first 8 chars) and output path on success"
      - "'primitiv compile' is registered in src/cli.ts and calls runCompile(resolve('.'))"
      - "PrimitivEngine has public readonly compiler: GovernanceCompiler property initialized in constructor"
      - "PrimitivEngine exposes compile() method returning GovernanceContext"
      - "PrimitivEngine exposes ensureGovernanceContext() method returning the full result object"
      - "src/index.ts exports GovernanceCompiler, ensureGovernanceContext, GovernanceContextSchema, CompilationWarningSchema, GovernanceContext type, CompilationWarning type"
      - "Existing CLI commands (init, validate, status, update, migrate) remain unaffected"
    dependsOn:
      - "TASK-002"

  - id: TASK-004
    title: "Slash command templates — compile command and downstream governance injection"
    description: "Create templates/commands/primitiv.compile.md slash command template. Update templates/commands/primitiv.plan.md, primitiv.tasks.md, and primitiv.implement.md to include a governance context pre-flight step that reads .primitiv/governance-context.json and injects the full JSON block into agent context. Register primitiv.compile.md in src/init/templates.ts."
    status: completed
    files:
      - "templates/commands/primitiv.compile.md"
      - "templates/commands/primitiv.plan.md"
      - "templates/commands/primitiv.tasks.md"
      - "templates/commands/primitiv.implement.md"
      - "src/init/templates.ts"
    acceptanceCriteria:
      - "templates/commands/primitiv.compile.md exists with YAML frontmatter (description field) and instructions to compile governance context, display results (sections present/absent, warnings, hash, path), and suggest next step"
      - "primitiv.plan.md Step 1 instructs Claude to check for .primitiv/governance-context.json; if present, read and inject full JSON as a '## Governance Context' block; if absent, warn and fall back to reading markdown files directly"
      - "primitiv.tasks.md Step 1 has the same governance context pre-flight as plan.md"
      - "primitiv.implement.md Phase 1 loads governance context using the same pre-flight; the subagent prompt template includes the full GovernanceContext JSON block alongside dev constitution and architecture context"
      - "'primitiv.compile.md' is added to the array returned by getCommandTemplateNames() in src/init/templates.ts"
      - "Existing template behavior for all other steps in plan/tasks/implement is preserved"
    dependsOn: []

  - id: TASK-005
    title: "Unit tests for GovernanceCompiler"
    description: "Create tests/governance.test.ts covering all GovernanceCompiler behaviors using the established tmp-dir test pattern from tests/gateValidation.test.ts. Tests must cover: successful compilation, partial governance, missing files, malformed YAML, hash determinism, staleness detection (version and hash), gitignore management, and ensureGovernanceContext() orchestration."
    status: completed
    files:
      - "tests/governance.test.ts"
    acceptanceCriteria:
      - "compile() with all 5 governance files present returns context with all sections non-null and warnings: []"
      - "compile() with security file missing returns context with security: null and warnings containing a message about the missing section"
      - "compile() with no governance files returns context with all 5 sections null and 5 entries in warnings"
      - "compile() with malformed YAML frontmatter throws GovernanceCompilationError; error message identifies the offending file"
      - "sourceHash is identical across two consecutive compile() calls on unchanged files (determinism)"
      - "isStale() returns true when cached.version is different from COMPILER_VERSION"
      - "isStale() returns true when a governance file is modified after caching"
      - "isStale() returns false when version matches and no files have changed"
      - "write() followed by readCached() returns a valid GovernanceContext"
      - "write() creates .primitiv/.gitignore containing 'governance-context.json'"
      - "Calling write() twice does not produce a duplicate 'governance-context.json' entry in .gitignore"
      - "ensureGovernanceContext() with no cached file: compiles, writes, returns recompiled: false"
      - "ensureGovernanceContext() with stale cache: recompiles, returns recompiled: true, notices contains a non-empty string"
      - "ensureGovernanceContext() with fresh cache: returns cached context, recompiled: false, notices: []"
      - "CompanyPrinciplesFrontmatterSchema parses operatingPrinciples array correctly"
      - "ProductConstitutionFrontmatterSchema parses modules array and lifecycleStates array correctly"
      - "All 16 test cases pass; vitest run exits 0"
    dependsOn:
      - "TASK-001"
      - "TASK-002"
updatedAt: "2026-03-28T00:00:00.000Z"
---

# Tasks — SPEC-005: Governance Compilation Layer

## Parallelism Structure

```
Wave 0 (parallel):  TASK-001  TASK-004
                       │
Wave 1 (sequential):  TASK-002
                      /    \
Wave 2 (parallel): TASK-003  TASK-005
```

- **TASK-001** and **TASK-004** have no dependencies and touch completely different files — run in parallel
- **TASK-002** depends on TASK-001 (needs schemas)
- **TASK-003** and **TASK-005** both depend only on TASK-002 and touch different file sets — run in parallel

---

## TASK-001: Schema layer — fix schema gaps and create GovernanceContextSchema

**Files:** `src/schemas/gates.ts`, `src/schemas/constitution.ts`, `src/schemas/governance.ts`

Add three fields that exist in real governance YAML but are silently stripped by Zod's `strip` mode:
- `operatingPrinciples: z.array(z.string()).default([])` → `CompanyPrinciplesFrontmatterSchema`
- `modules: z.array(z.object({ name: z.string(), description: z.string().optional() })).default([])` → `ProductConstitutionFrontmatterSchema`
- `lifecycleStates: z.array(z.string()).default([])` → `ProductConstitutionFrontmatterSchema`

Create `src/schemas/governance.ts` with `CompilationWarningSchema` and `GovernanceContextSchema` composing all five existing frontmatter schemas as nullable fields, plus exported types.

**Acceptance criteria:**
- `CompanyPrinciplesFrontmatterSchema` includes `operatingPrinciples: z.array(z.string()).default([])`
- `ProductConstitutionFrontmatterSchema` includes `modules` and `lifecycleStates` fields
- `src/schemas/governance.ts` exports `GovernanceContextSchema` with all 5 nullable sections + `version`, `compiledAt`, `sourceHash`, `warnings`
- `GovernanceContext` and `CompilationWarning` types exported via `z.infer<>`
- All existing tests in `tests/schemas.test.ts` pass

---

## TASK-002: GovernanceCompiler engine class

**Files:** `src/engine/GovernanceCompiler.ts`, `src/utils/errors.ts`

Create the `GovernanceCompiler` class and `ensureGovernanceContext()` function. Add `GovernanceCompilationError` to `errors.ts`.

Key behaviors:
- `compile()` wraps GateManager/ConstitutionManager in try/catch — missing files → `null` section + warning; malformed YAML → throw `GovernanceCompilationError`
- `sourceHash` = SHA-256 of all existing governance file contents concatenated in alphabetically-sorted path order
- `isStale(cached)` checks version mismatch OR hash mismatch
- `write()` writes JSON to `.primitiv/governance-context.json` and manages `.primitiv/.gitignore`
- `ensureGovernanceContext()` orchestrates read → staleness check → conditional recompile → return

**Acceptance criteria:** See tasks frontmatter above.

---

## TASK-003: CLI integration — compile command, PrimitivEngine facade, SDK exports

**Files:** `src/commands/compile.ts`, `src/cli.ts`, `src/engine/PrimitivEngine.ts`, `src/index.ts`

Wire GovernanceCompiler into the CLI (`primitiv compile`) and SDK (`PrimitivEngine.compiler`, `src/index.ts` exports).

`runCompile()` output format:
```
Compiling governance context...
  ⚠ Security principles not found — generate with /primitiv.gate-2

✓ Governance context compiled
  Sections: company ✓  security ⚠  product ✓  development ✓  architecture ✓
  Hash: a3f9c1d2...
  File: .primitiv/governance-context.json (gitignored)
```

**Acceptance criteria:** See tasks frontmatter above.

---

## TASK-004: Slash command templates — compile command and downstream governance injection

**Files:** `templates/commands/primitiv.compile.md`, `templates/commands/primitiv.plan.md`, `templates/commands/primitiv.tasks.md`, `templates/commands/primitiv.implement.md`, `src/init/templates.ts`

**New template** `primitiv.compile.md`: Instructions to run `primitiv compile`, display results, handle warnings, suggest next step.

**Updated templates** — add governance pre-flight at Step 1 of each:
```markdown
### Governance Context (pre-flight)
1. Check if `.primitiv/governance-context.json` exists
   - **If YES**: Read it. Include the full JSON as a structured block:
     ## Governance Context
     ```json
     { <full governance-context.json contents> }
     ```
   - **If NO**: Warn: "Run `primitiv compile` for consistent governance context."
     Fall back: read `.primitiv/gates/` and `.primitiv/constitutions/` markdown files directly.
```

For `primitiv.implement.md` subagent prompt template: add the GovernanceContext JSON block alongside the existing dev constitution and architecture context.

**Acceptance criteria:** See tasks frontmatter above.

---

## TASK-005: Unit tests for GovernanceCompiler

**Files:** `tests/governance.test.ts`

16 test cases covering all GovernanceCompiler behaviors using the tmp-dir pattern established in `tests/gateValidation.test.ts`.

**Acceptance criteria:** See tasks frontmatter above. All 16 tests pass; `vitest run` exits 0.
