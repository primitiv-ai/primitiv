---
type: tasks
version: 1
specId: SPEC-003
tasks:
  - id: TASK-001
    title: "Create SpecKit Zod schemas and MigrationManager skeleton"
    description: "Create src/schemas/speckit.ts with loose Zod schemas for parsing SpecKit artifacts (frontmatter passthrough). Create src/engine/MigrationManager.ts with the class skeleton, interfaces (SpecMapping, MigrationReport, MigrationOptions), and detection method."
    status: completed
    files:
      - "src/schemas/speckit.ts"
      - "src/engine/MigrationManager.ts"
      - "src/utils/errors.ts"
    acceptanceCriteria:
      - "SpecKit schemas defined: SpecKitSpecFrontmatterSchema (passthrough), SpecKitConstitutionSectionSchema"
      - "MigrationManager class exists with constructor(projectRoot: string)"
      - "detectSpecKit() method returns { found, specifyDir, specsDir, claudeMdPath }"
      - "discoverSpecKitSpecs() returns sorted directory names from specs/"
      - "buildSpecMapping() creates sequential SPEC-XXX IDs from sorted spec dirs"
      - "MigrationNotFoundError added to errors.ts for 'No SpecKit project detected'"
      - "All interfaces exported: SpecMapping, MigrationReport, MigrationOptions"
  - id: TASK-002
    title: "Implement constitution splitting and architecture migration"
    description: "Implement the multi-strategy constitution parser (H2 match → keyword fuzzy → fallback) that splits constitution.md into product and development sections. Implement CLAUDE.md migration with full copy + tech stack entry re-referencing."
    status: completed
    dependsOn: ["TASK-001"]
    files:
      - "src/engine/MigrationManager.ts"
    acceptanceCriteria:
      - "splitConstitution() splits content by '## Product Principles' and '## Development Principles' H2 headers"
      - "Falls back to keyword fuzzy match at any heading level if H2 match fails"
      - "Falls back to entire file → product.md if no sections detected, returns null for development"
      - "Shared sections (Principle Interlock, Unacceptable Risks, Governance, Explicit Exclusions) go to product content"
      - "migrateConstitution() writes product.md and development.md with Primitiv frontmatter, skips if files already exist"
      - "reReferenceTechtackEntries() replaces (NNN-slug) patterns with (SPEC-XXX) using the mapping table"
      - "migrateArchitecture() copies full CLAUDE.md with re-referenced entries and Primitiv arch-constitution frontmatter"
  - id: TASK-003
    title: "Implement spec migration and state management"
    description: "Implement per-spec migration: frontmatter transformation, artifact copying (spec.md, plan.md, tasks.md, research.md, data-model.md, quickstart.md, checklists/, contracts/), and state.json update with merge strategy."
    status: completed
    dependsOn: ["TASK-001"]
    files:
      - "src/engine/MigrationManager.ts"
    acceptanceCriteria:
      - "migrateSpec() creates SPEC-XXX-slug/ directory under .primitiv/specs/"
      - "spec.md frontmatter is transformed to Primitiv schema (type: spec, id, title, status: completed, branch, author, timestamps)"
      - "plan.md frontmatter adapted if present, content preserved"
      - "tasks.md frontmatter adapted if present, content preserved"
      - "research.md copied directly to spec dir"
      - "data-model.md moved into data-model/ subdirectory"
      - "quickstart.md copied directly"
      - "checklists/ and contracts/ directories copied preserving structure"
      - "Skips spec if target directory already exists (merge strategy)"
      - "updateState() sets mode: brownfield, updates nextSpecId to highest migrated + 1, preserves other fields"
  - id: TASK-004
    title: "Implement migration orchestrator and report generation"
    description: "Implement the main migrate() method that orchestrates detection → constitution → architecture → specs → state → report. Build the colored terminal report with mapping table."
    status: completed
    dependsOn: ["TASK-002", "TASK-003"]
    files:
      - "src/engine/MigrationManager.ts"
    acceptanceCriteria:
      - "migrate() orchestrates the full pipeline: detect → constitutions → architecture → specs → state → report"
      - "Returns MigrationReport with specsMigrated, specsSkipped, constitutionsMigrated/Skipped, warnings, errors"
      - "Warnings include manual steps: gate-1, gate-2, dev constitution (if not embedded)"
      - "Gates directory is created with placeholder if not existing"
      - "Migration is idempotent — running twice produces same result without duplicating specs"
  - id: TASK-005
    title: "Create CLI command and register in Commander"
    description: "Create src/commands/migrate.ts with the CLI handler that invokes MigrationManager and prints the colored report with mapping table. Register 'primitiv migrate speckit' in src/cli.ts."
    status: completed
    dependsOn: ["TASK-004"]
    files:
      - "src/commands/migrate.ts"
      - "src/cli.ts"
    acceptanceCriteria:
      - "'primitiv migrate speckit' command registered in Commander"
      - "CLI handler calls MigrationManager.migrate() and prints colored output"
      - "Prints detection results, constitution migration, architecture migration, per-spec migration"
      - "Prints spec ID mapping table using cli-table3"
      - "Prints summary (counts) and warnings (manual steps)"
      - "Exits with error if no SpecKit project detected"
  - id: TASK-006
    title: "Create slash command and update templates"
    description: "Create the /primitiv.migrate Claude Code slash command (both in .claude/commands/ and templates/commands/). Update templates.ts to include it. Update primitiv.implement.md to append tech stack entries."
    status: completed
    dependsOn: ["TASK-004"]
    files:
      - ".claude/commands/primitiv.migrate.md"
      - "templates/commands/primitiv.migrate.md"
      - "src/init/templates.ts"
      - ".claude/commands/primitiv.implement.md"
      - "templates/commands/primitiv.implement.md"
    acceptanceCriteria:
      - "/primitiv.migrate slash command exists with description and instructions for AI-driven migration"
      - "Template version exists in templates/commands/ (installed by primitiv init/update)"
      - "getCommandTemplateNames() includes 'primitiv.migrate.md'"
      - "primitiv.implement.md has new step to append tech stack entry to constitutions/architecture.md after all tasks"
      - "Both .claude/commands/ and templates/commands/ versions of implement.md are updated identically"
  - id: TASK-007
    title: "Update SDK exports and PrimitivEngine"
    description: "Export MigrationManager and SpecKit schemas from index.ts. Add MigrationManager as an optional property on PrimitivEngine."
    status: completed
    dependsOn: ["TASK-004"]
    files:
      - "src/index.ts"
      - "src/engine/PrimitivEngine.ts"
    acceptanceCriteria:
      - "MigrationManager exported from index.ts"
      - "SpecKit schemas exported from index.ts"
      - "MigrationNotFoundError exported from index.ts"
      - "PrimitivEngine has a migration getter that returns a MigrationManager instance"
  - id: TASK-008
    title: "Write comprehensive test suite"
    description: "Create tests/migration.test.ts with tests covering: detection, constitution splitting (all 3 strategies), CLAUDE.md re-referencing, spec migration, merge strategy, idempotency, and error cases."
    status: completed
    dependsOn: ["TASK-004"]
    files:
      - "tests/migration.test.ts"
    acceptanceCriteria:
      - "Test: detectSpecKit returns found=true when .specify/ and specs/ exist"
      - "Test: detectSpecKit returns found=false when neither exists"
      - "Test: splitConstitution splits on H2 headers correctly"
      - "Test: splitConstitution falls back to keyword match when no H2 headers"
      - "Test: splitConstitution returns null development when no dev section found"
      - "Test: reReferenceTechtackEntries replaces (NNN-slug) with (SPEC-XXX)"
      - "Test: reReferenceTechtackEntries preserves unmatched lines"
      - "Test: migrateSpec creates correct directory structure and frontmatter"
      - "Test: migrateSpec copies all artifact types (research, data-model, contracts, checklists)"
      - "Test: merge strategy skips existing files"
      - "Test: full migrate() is idempotent"
      - "Test: state.json updated with mode: brownfield and correct nextSpecId"
      - "All tests pass with vitest run"
updatedAt: "2026-03-16T11:00:00Z"
---

# Tasks — SPEC-003: SpecKit-to-Primitiv Migration

## TASK-001: Create SpecKit Zod schemas and MigrationManager skeleton

**Status:** pending

Create the foundational types, schemas, and class skeleton that all subsequent tasks build on.

### Files
- `src/schemas/speckit.ts` — Zod schemas for parsing SpecKit artifacts (loose, with `.passthrough()`)
- `src/engine/MigrationManager.ts` — Class skeleton with interfaces and detection methods
- `src/utils/errors.ts` — Add `MigrationNotFoundError`

### Details
- `SpecKitSpecFrontmatterSchema`: Accepts any SpecKit spec.md frontmatter (title, status, version, author — all optional with passthrough for unknown fields)
- `MigrationManager` class with `constructor(projectRoot: string)`
- `detectSpecKit()`: Checks for `.specify/` dir, `specs/` dir, and `CLAUDE.md` in project root
- `discoverSpecKitSpecs(specsDir)`: Reads `specs/` directory, filters directories matching `<NNN>-<slug>` pattern, sorts by numeric prefix
- `buildSpecMapping(specDirs)`: Assigns sequential SPEC-001, SPEC-002, etc. to sorted spec dirs
- All interfaces exported: `SpecMapping`, `MigrationReport`, `MigrationOptions`

---

## TASK-002: Implement constitution splitting and architecture migration

**Status:** pending
**Depends on:** TASK-001

### Files
- `src/engine/MigrationManager.ts` — Add splitting and architecture migration methods

### Details

**Constitution Splitting (`splitConstitution`):**
1. Strategy 1 — Scan for `## Product Principles` and `## Development Principles` H2 headers. Split content between these sections.
2. Strategy 2 — If no H2 match, scan all headings (`#` through `####`) for keywords "product" or "development".
3. Strategy 3 — Fallback: entire content → product, development = null, emit warning.
4. Shared sections detected by heading keywords: "Principle Interlock", "Unacceptable Risks", "Governance", "Explicit Exclusions", "Amendment Procedure" — appended to product.

**`migrateConstitution()`:**
- Read `.specify/memory/constitution.md`
- Call `splitConstitution()` to get product + dev content
- Wrap each in Primitiv frontmatter (`ProductConstitutionFrontmatterSchema`, `DevConstitutionFrontmatterSchema`)
- Write to `.primitiv/constitutions/product.md` and `development.md` (skip if exists)

**Tech Stack Re-referencing (`reReferenceTechtackEntries`):**
- Regex: `/\((\d+-[a-z0-9-]+)\)\s*$/gm` to match `(NNN-slug)` at end of lines
- Look up slug in mapping table, replace with `(SPEC-XXX)`
- Unmatched entries preserved as-is

**`migrateArchitecture(mappings)`:**
- Read `CLAUDE.md` from project root
- Call `reReferenceTechtackEntries()` with mapping table
- Wrap in Primitiv `ArchConstitutionFrontmatterSchema` frontmatter
- Write to `.primitiv/constitutions/architecture.md` (skip if exists)

---

## TASK-003: Implement spec migration and state management

**Status:** pending
**Depends on:** TASK-001

### Files
- `src/engine/MigrationManager.ts` — Add spec migration and state update methods

### Details

**`migrateSpec(sourceDir, mapping)`:**
1. Create target directory: `.primitiv/specs/SPEC-XXX-<slug>/`
2. If target directory exists → skip (return `migrated: false`)
3. For `spec.md`:
   - Parse SpecKit frontmatter with gray-matter (loose, no strict schema)
   - Transform to Primitiv frontmatter: `{ type: "spec", id: mapping.primitivId, title, status: "completed", version: 1, branch: "spec/SPEC-XXX-slug", author, createdAt, updatedAt: now }`
   - Preserve markdown content body
4. For `plan.md`, `tasks.md`: Similar frontmatter transformation, preserve content
5. For `research.md`, `quickstart.md`: Copy directly (add minimal frontmatter if missing)
6. For `data-model.md`: Copy to `data-model/data-model.md` subdirectory
7. For `checklists/`, `contracts/`: Recursively copy directories preserving structure

**`updateState(specCount, existingNextId)`:**
- Load existing `.state.json` if present
- Set `mode: "brownfield"`
- Set `nextSpecId` to `max(existingNextId, specCount + 1)`
- Preserve `nextFeatureId`, `projectRoot`, `initializedAt`
- Save back

---

## TASK-004: Implement migration orchestrator and report generation

**Status:** pending
**Depends on:** TASK-002, TASK-003

### Files
- `src/engine/MigrationManager.ts` — Add `migrate()` orchestration method

### Details

**`migrate()` pipeline:**
1. `detectSpecKit()` — abort with `MigrationNotFoundError` if not found
2. `discoverSpecKitSpecs()` + `buildSpecMapping()` — build the mapping table
3. `ensurePrimitivDir()` — create `.primitiv/` structure if missing
4. `migrateConstitution()` — split and write constitutions
5. `migrateArchitecture(mappings)` — copy CLAUDE.md with re-referencing
6. Loop: `migrateSpec()` for each spec in mapping order
7. Create `gates/` directory with placeholder README if no gates exist
8. `updateState()` — set brownfield mode, update nextSpecId
9. Build and return `MigrationReport`

**Report structure:**
```typescript
{
  specsMigrated: SpecMapping[],
  specsSkipped: string[],
  constitutionsMigrated: string[],
  constitutionsSkipped: string[],
  architectureMigrated: boolean,
  warnings: string[],  // Manual steps
  errors: string[]     // Non-fatal issues
}
```

**Warnings always include:**
- "Create company principles: /primitiv.gate-1" (if no gate exists)
- "Create security principles: /primitiv.gate-2" (if no gate exists)
- "Create development constitution manually: /primitiv.constitution development" (if constitution.md had no dev section)

---

## TASK-005: Create CLI command and register in Commander

**Status:** pending
**Depends on:** TASK-004

### Files
- `src/commands/migrate.ts` — CLI command handler
- `src/cli.ts` — Register subcommand

### Details

**`src/commands/migrate.ts`:**
- `runMigrate(targetDir: string)` function
- Calls `assertGitRepo(targetDir)`
- Creates `MigrationManager(targetDir)` and calls `migrate()`
- Prints colored output using chalk:
  - Detection: `✓ Found .specify/`, `✓ Found specs/ with N specs`, `✓ Found CLAUDE.md`
  - Constitutions: `✓ Product constitution → ...`, `✓ Development constitution → ...`
  - Architecture: `✓ CLAUDE.md → ...`
  - Per-spec: `✓ SPEC-001 ← 133-fix-package-upload-state (spec.md, plan.md, ...)`
  - Mapping table via cli-table3
  - Summary line
  - Warnings with `⚠` prefix

**`src/cli.ts`:**
- Add `migrate` command with `speckit` subcommand
- `primitiv migrate speckit` invokes `runMigrate(resolve("."))`

---

## TASK-006: Create slash command and update templates

**Status:** pending
**Depends on:** TASK-004

### Files
- `.claude/commands/primitiv.migrate.md` — Slash command for Claude Code
- `templates/commands/primitiv.migrate.md` — Template source
- `src/init/templates.ts` — Add to template list
- `.claude/commands/primitiv.implement.md` — Add tech stack append step
- `templates/commands/primitiv.implement.md` — Same change in template

### Details

**`/primitiv.migrate` command:**
- Description: "Migrate a SpecKit project to Primitiv format"
- Instructions for AI-driven migration: detect SpecKit, call migration, report results
- References CLI equivalent: `primitiv migrate speckit`

**`/primitiv.implement` update:**
- Add new step after "When all tasks are done" (step 5):
  ```
  6. **Update architecture log:**
     - Append a tech stack entry to `constitutions/architecture.md`
     - Format: `- <stack, DB changes, new deps> (SPEC-XXX)`
     - If no infrastructure changes: `- N/A (no infrastructure changes) (SPEC-XXX)`
  ```
- Both `.claude/commands/` and `templates/commands/` versions updated identically

**`templates.ts` update:**
- Add `"primitiv.migrate.md"` to `getCommandTemplateNames()` array

---

## TASK-007: Update SDK exports and PrimitivEngine

**Status:** pending
**Depends on:** TASK-004

### Files
- `src/index.ts` — Add exports
- `src/engine/PrimitivEngine.ts` — Add migration property

### Details

**`src/index.ts`:**
- Add `export { MigrationManager } from "./engine/MigrationManager.js"`
- Add `export * from "./schemas/speckit.js"`
- Add `MigrationNotFoundError` to errors export

**`src/engine/PrimitivEngine.ts`:**
- Import `MigrationManager`
- Add `get migration(): MigrationManager` getter that lazily creates a `MigrationManager(this.projectRoot)`

---

## TASK-008: Write comprehensive test suite

**Status:** pending
**Depends on:** TASK-004

### Files
- `tests/migration.test.ts`

### Details

Follow existing test patterns: Vitest, real filesystem with `tmpdir()`, `execSync("git init")` for git repo setup.

**Test groups:**
1. **Detection tests:**
   - `detectSpecKit()` returns `found: true` when `.specify/` and `specs/` exist
   - Returns `found: false` when neither exists
   - Returns partial results (e.g., `claudeMdPath: undefined` if no CLAUDE.md)

2. **Spec discovery tests:**
   - `discoverSpecKitSpecs()` sorts by numeric prefix
   - Ignores non-matching directories
   - `buildSpecMapping()` creates sequential SPEC-001, SPEC-002, etc.

3. **Constitution splitting tests:**
   - Splits on H2 headers correctly (both product and dev extracted)
   - Falls back to keyword match when no H2 headers
   - Returns null development when no dev section found
   - Shared sections go to product content

4. **Architecture migration tests:**
   - `reReferenceTechtackEntries()` replaces `(NNN-slug)` with `(SPEC-XXX)`
   - Preserves unmatched lines and non-tech-stack content
   - Handles content with no tech stack entries

5. **Spec migration tests:**
   - Creates correct directory structure and transformed frontmatter
   - Copies all artifact types (research, data-model → subdirectory, contracts, checklists)
   - Skips missing optional artifacts without error

6. **Merge strategy tests:**
   - Skips existing constitution files
   - Skips already-migrated specs
   - Merges state.json (preserves existing fields, updates mode + nextSpecId)

7. **Full migration tests:**
   - `migrate()` end-to-end on a mock SpecKit project
   - Idempotency: running twice produces same result
   - `MigrationNotFoundError` thrown when no SpecKit detected

8. **State tests:**
   - `updateState()` sets brownfield mode
   - `nextSpecId` reflects migrated count + 1
