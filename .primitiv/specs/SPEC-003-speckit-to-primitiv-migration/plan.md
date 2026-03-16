---
type: plan
version: 1
specId: SPEC-003
approach: "New MigrationManager + CLI command that detects SpecKit artifacts, splits constitution, copies CLAUDE.md with ID re-referencing, and migrates specs sequentially — following the existing Manager pattern"
fileChanges:
  - path: "src/engine/MigrationManager.ts"
    action: create
    description: "Core migration engine: detection, constitution splitting, CLAUDE.md parsing, spec migration, state initialization, merge strategy"
  - path: "src/schemas/speckit.ts"
    action: create
    description: "Zod schemas for parsing SpecKit artifacts: spec frontmatter, constitution sections, tech stack entry patterns"
  - path: "src/commands/migrate.ts"
    action: create
    description: "CLI command handler for 'primitiv migrate speckit' — orchestrates MigrationManager and prints colored report"
  - path: "src/cli.ts"
    action: modify
    description: "Register 'migrate speckit' subcommand under Commander.js"
  - path: "src/index.ts"
    action: modify
    description: "Export MigrationManager and migration schemas"
  - path: "src/engine/PrimitivEngine.ts"
    action: modify
    description: "Add MigrationManager as optional engine property (available when migration context detected)"
  - path: ".claude/commands/primitiv.migrate.md"
    action: create
    description: "Claude Code slash command for /primitiv.migrate"
  - path: "templates/commands/primitiv.migrate.md"
    action: create
    description: "Template for the migrate command (installed by 'primitiv init' and 'primitiv update')"
  - path: ".claude/commands/primitiv.implement.md"
    action: modify
    description: "Add step to append tech stack entry to constitutions/architecture.md after all tasks complete"
  - path: "templates/commands/primitiv.implement.md"
    action: modify
    description: "Same implement.md change in template source"
  - path: "src/init/installCommands.ts"
    action: modify
    description: "Ensure primitiv.migrate.md is included in command template list"
  - path: "tests/migration.test.ts"
    action: create
    description: "Comprehensive test suite: detection, constitution split, CLAUDE.md parsing, spec migration, merge strategy, idempotency"
risks:
  - "SpecKit constitution.md has no guaranteed structure — the multi-strategy parser must handle variations gracefully"
  - "CLAUDE.md tech stack entry regex may miss non-standard formats — need to handle unmatched lines as passthrough"
  - "Large SpecKit projects (100+ specs) could produce slow sequential file I/O — acceptable for migration (one-time operation)"
  - "Existing .primitiv/ merge could conflict if user manually created specs with same slugs"
dependencies:
  - "gray-matter (already installed) — for frontmatter parsing of SpecKit files"
  - "chalk (already installed) — for colored migration report output"
  - "No new external dependencies needed"
codebaseAnalysis:
  existingCode:
    - "src/utils/frontmatter.ts — parseDocument/serializeDocument for YAML+markdown handling"
    - "src/utils/ids.ts — nextSpecId(), slugify(), StateFile interface with mode field"
    - "src/utils/fileSystem.ts — ensurePrimitivDir, writePrimitivFile, readPrimitivFile, listSpecDirs"
    - "src/utils/errors.ts — PrimitivError hierarchy for typed error handling"
    - "src/schemas/constitution.ts — ProductConstitutionSchema, DevConstitutionSchema, ArchConstitutionSchema"
    - "src/schemas/spec.ts — SpecFrontmatterSchema with status, id, title, branch fields"
    - "src/state/specStateMachine.ts — SpecStatus enum including 'completed'"
    - "src/engine/ConstitutionManager.ts — write/read constitutions with frontmatter"
    - "src/engine/SpecManager.ts — createSpec pattern with directory creation and state update"
    - "src/init/brownfield.ts — detectStack() pattern for inspecting existing project"
    - "src/commands/*.ts — CLI command handler pattern (chalk output, table formatting)"
  reusableModules:
    - "parseDocument + serializeDocument — parse SpecKit frontmatter, serialize Primitiv frontmatter"
    - "slugify — normalize SpecKit slugs to Primitiv format"
    - "ensurePrimitivDir + writePrimitivFile — create target directories and write files"
    - "StateFile read/write from ids.ts — update .state.json with brownfield mode"
    - "chalk + cli-table3 — migration report formatting"
    - "All Zod schemas — validate generated Primitiv artifacts before writing"
  patternsToFollow:
    - "Manager class pattern (constructor takes projectRoot, methods are domain-specific)"
    - "CLI command pattern (exported function receiving parsed args, returns void, uses chalk for output)"
    - "Frontmatter document pattern (YAML header + markdown content, validated by Zod)"
    - "Test pattern (Vitest, real filesystem with tmpdir, git init for isolation)"
    - "Error pattern (custom PrimitivError subclass with code property)"
updatedAt: "2026-03-16T10:45:00Z"
---

# Technical Plan — SPEC-003: SpecKit-to-Primitiv Migration

## 1. Approach

Add a `MigrationManager` engine class following the existing Manager pattern. It handles:

1. **Detection** — Scan for `.specify/` and `specs/` directories
2. **Constitution splitting** — Multi-strategy parser to split `constitution.md` into product + dev constitutions
3. **Architecture migration** — Full copy of `CLAUDE.md` with tech stack entry ID re-referencing
4. **Spec migration** — Sequential re-numbering, frontmatter transformation, artifact copying
5. **State initialization** — Create/update `.state.json` with merge strategy
6. **Report generation** — Colored terminal output with mapping table

A CLI command (`primitiv migrate speckit`) and a Claude Code slash command (`/primitiv.migrate`) both invoke the same `MigrationManager`.

## 2. Codebase Analysis

### What Already Exists

The codebase provides strong foundations:

- **Frontmatter handling** (`src/utils/frontmatter.ts`): `parseDocument` and `serializeDocument` handle YAML+markdown parsing using gray-matter. Can parse SpecKit frontmatter directly (schema-agnostic parsing via `gray-matter` raw mode) and serialize Primitiv frontmatter.
- **ID generation** (`src/utils/ids.ts`): `nextSpecId()` generates `SPEC-XXX` format IDs. `slugify()` normalizes text. The `StateFile` interface already has a `mode: "greenfield" | "brownfield"` field.
- **Filesystem utilities** (`src/utils/fileSystem.ts`): `ensurePrimitivDir()` creates the full directory tree. `writePrimitivFile()` / `readPrimitivFile()` handle path construction. `listSpecDirs()` lists spec directories.
- **Constitution schemas** (`src/schemas/constitution.ts`): Zod schemas for product, dev, and architecture constitutions. The migration generates frontmatter conforming to these schemas.
- **Spec schemas** (`src/schemas/spec.ts`): `SpecFrontmatterSchema` defines the target structure for migrated spec frontmatter.
- **State machine** (`src/state/specStateMachine.ts`): `SpecStatus` enum includes `completed` — the status all migrated specs will get.
- **CLI pattern** (`src/commands/*.ts`): Existing commands use chalk for colored output and cli-table3 for tables. The migration report follows this pattern.
- **Brownfield init** (`src/init/brownfield.ts`): Already has a `detectStack()` function that inspects the project — similar pattern for `detectSpecKit()`.

### What Needs to Be Built

1. **MigrationManager** — New engine class (the core logic)
2. **SpecKit schemas** — Zod schemas for parsing SpecKit artifacts (loose validation — SpecKit frontmatter varies)
3. **Constitution parser** — Multi-strategy section splitter
4. **Tech stack entry re-referencer** — Regex-based slug→ID replacement
5. **CLI command** — `migrate speckit` subcommand
6. **Slash command** — `/primitiv.migrate` for Claude Code
7. **Implement command update** — Append tech stack entry step

## 3. Detailed Design

### 3.1 MigrationManager (`src/engine/MigrationManager.ts`)

```typescript
interface MigrationOptions {
  projectRoot: string
  dryRun?: boolean  // Preview without writing (future enhancement)
}

interface SpecMapping {
  original: string       // e.g., "133-fix-package-upload-state"
  primitivId: string     // e.g., "SPEC-001"
  slug: string           // e.g., "fix-package-upload-state"
  primitivDir: string    // e.g., "SPEC-001-fix-package-upload-state"
}

interface MigrationReport {
  specsMigrated: SpecMapping[]
  specsSkipped: string[]          // Already existed in .primitiv/
  constitutionsMigrated: string[] // e.g., ["product", "development"]
  constitutionsSkipped: string[]  // Already existed
  architectureMigrated: boolean
  warnings: string[]              // Manual steps needed
  errors: string[]                // Non-fatal errors
}

class MigrationManager {
  constructor(private projectRoot: string)

  // Detection
  detectSpecKit(): { found: boolean; specifyDir?: string; specsDir?: string; claudeMdPath?: string }

  // Spec discovery & mapping
  discoverSpecKitSpecs(specsDir: string): string[]  // Returns sorted dir names
  buildSpecMapping(specDirs: string[]): SpecMapping[]

  // Constitution migration
  splitConstitution(content: string): { product: string; development: string | null; shared: string }
  migrateConstitution(): { migrated: string[]; skipped: string[]; warnings: string[] }

  // Architecture migration
  reReferenceTechtackEntries(content: string, mappings: SpecMapping[]): string
  migrateArchitecture(mappings: SpecMapping[]): { migrated: boolean; skipped: boolean }

  // Spec migration
  migrateSpec(sourceDir: string, mapping: SpecMapping): { migrated: boolean; artifacts: string[] }

  // State
  updateState(specCount: number, existingNextId: number): void

  // Orchestration
  migrate(): MigrationReport
}
```

### 3.2 Constitution Splitting Strategy

The `splitConstitution` method uses a priority cascade:

**Strategy 1 — H2 header match (most common):**
```
Scan for exact `## Product Principles` and `## Development Principles` headers.
Content between `## Product Principles` and `## Development Principles` → product.
Content from `## Development Principles` to end (or next major section) → development.
```

**Strategy 2 — Keyword fuzzy match:**
```
Scan all heading lines (# through ####) for keywords "product" or "development".
Split on the first matching heading for each type.
```

**Strategy 3 — Fallback:**
```
No recognizable sections found → entire file → product.md.
Emit warning: "Development constitution not found in constitution.md — create manually."
```

**Shared sections** (Principle Interlock, Unacceptable Risks, Governance, Explicit Exclusions, Amendment Procedure) are detected by heading keywords and appended to product.md.

### 3.3 CLAUDE.md Tech Stack Re-referencing

Tech stack entries follow the pattern: `- <text> (<NNN>-<slug>)` where `<NNN>` is a number and `<slug>` is a hyphenated string.

Regex: `/\((\d+-[a-z0-9-]+)\)\s*$/gm`

For each match, look up the slug in the mapping table and replace with the Primitiv spec ID:
- `(133-fix-package-upload-state)` → `(SPEC-001)`
- If no mapping found, keep original (warn in report)

The full CLAUDE.md content is preserved; only the slug references are swapped.

### 3.4 Spec Frontmatter Transformation

SpecKit spec.md frontmatter (variable, may include any of):
```yaml
title: "..."
status: draft|in-progress|complete|...
version: N
author: "..."
createdAt: "..."
```

Primitiv spec.md frontmatter (strict):
```yaml
type: spec
id: SPEC-XXX
title: "<from SpecKit or derived from slug>"
status: completed
version: 1
branch: "spec/SPEC-XXX-<slug>"
author: "<from SpecKit or git user>"
createdAt: "<from SpecKit or now>"
updatedAt: "<now>"
```

For plan.md and tasks.md, similar transformation applies — preserve content body, replace frontmatter with Primitiv schema.

### 3.5 Merge Strategy

Before writing any file, check if it already exists in `.primitiv/`:

| Target | Exists? | Action |
|--------|---------|--------|
| `constitutions/product.md` | Yes | Skip, warn |
| `constitutions/development.md` | Yes | Skip, warn |
| `constitutions/architecture.md` | Yes | Skip, warn |
| `specs/SPEC-XXX-slug/` | Yes | Skip entire spec, add to `specsSkipped` |
| `.state.json` | Yes | Read existing, update `nextSpecId` and `mode`, preserve other fields |
| `gates/` | Yes | Keep existing, don't overwrite |
| `gates/` | No | Create directory with placeholder README noting manual setup needed |

### 3.6 CLI Command (`src/commands/migrate.ts`)

```
$ primitiv migrate speckit

Detecting SpecKit project...
  ✓ Found .specify/ directory
  ✓ Found specs/ directory with 8 specs
  ✓ Found CLAUDE.md

Migrating constitutions...
  ✓ Product constitution → .primitiv/constitutions/product.md
  ✓ Development constitution → .primitiv/constitutions/development.md

Migrating architecture...
  ✓ CLAUDE.md → .primitiv/constitutions/architecture.md (12 tech stack entries re-referenced)

Migrating specs...
  ✓ SPEC-001 ← 133-fix-package-upload-state (spec.md, plan.md, tasks.md)
  ✓ SPEC-002 ← 135-operational-dashboard (spec.md, plan.md, tasks.md, research.md)
  ...

Spec ID Mapping:
┌──────────┬──────────────────────────────────┐
│ Primitiv │ Original (SpecKit)               │
├──────────┼──────────────────────────────────┤
│ SPEC-001 │ 133-fix-package-upload-state      │
│ SPEC-002 │ 135-operational-dashboard         │
│ ...      │ ...                              │
└──────────┴──────────────────────────────────┘

Summary: 8 specs migrated, 2 constitutions created, 1 architecture migrated

⚠ Manual steps remaining:
  - Create company principles: /primitiv.gate-1
  - Create security principles: /primitiv.gate-2
  - Review migrated constitutions for accuracy
```

### 3.7 Slash Command (`/primitiv.migrate`)

A Claude Code command that:
1. Calls `primitiv migrate speckit` CLI command
2. Or directly invokes the same logic via the SDK

The command is AI-driven — it reads the SpecKit project, calls the migration engine, and reports results.

### 3.8 Implement Command Enhancement

Add a new step after all tasks are complete in `/primitiv.implement`:

```markdown
4. **After all tasks are complete — update architecture log:**
   - Append a tech stack entry to `constitutions/architecture.md`
   - Format: `- <stack, DB changes, new deps> (SPEC-XXX)`
   - If no database or stack changes, write: `- N/A (no infrastructure changes) (SPEC-XXX)`
   - This keeps the architecture constitution as a running log of what each spec introduced
```

## 4. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/engine/MigrationManager.ts` | Create | Core migration engine (detection, parsing, writing, reporting) |
| `src/schemas/speckit.ts` | Create | Zod schemas for SpecKit artifact parsing |
| `src/commands/migrate.ts` | Create | CLI command handler with colored report |
| `src/cli.ts` | Modify | Register `migrate speckit` subcommand |
| `src/index.ts` | Modify | Export MigrationManager + schemas |
| `src/engine/PrimitivEngine.ts` | Modify | Add migration getter |
| `.claude/commands/primitiv.migrate.md` | Create | Claude Code slash command |
| `templates/commands/primitiv.migrate.md` | Create | Template for install/update |
| `.claude/commands/primitiv.implement.md` | Modify | Add tech stack append step |
| `templates/commands/primitiv.implement.md` | Modify | Same change in template |
| `src/init/installCommands.ts` | Modify | Include migrate template in command list |
| `tests/migration.test.ts` | Create | Test suite (detection, splitting, re-referencing, migration, merge, idempotency) |

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Constitution.md has no `## Product/Development Principles` headers | Split fails, all content goes to product.md | Multi-strategy cascade with fallback + warning in report |
| Tech stack regex misses non-standard entry formats | Some entries not re-referenced | Passthrough unmatched lines, warn in report |
| SpecKit frontmatter has unexpected fields | Zod parse fails | Use `.passthrough()` on SpecKit schemas to accept unknown fields |
| Large repos (100+ specs) slow migration | User waits | Acceptable — one-time operation, sequential I/O is fine |
| Slug collision after re-numbering | Two specs map to same directory | Sort by original number ensures uniqueness; slugs preserved from SpecKit |

## 6. Dependencies

- **No new npm packages** — all needed libraries (gray-matter, chalk, cli-table3, zod, commander) are already installed
- **gray-matter** for SpecKit frontmatter parsing (already a production dependency)
- **Zod** for both SpecKit input validation (loose) and Primitiv output validation (strict)
