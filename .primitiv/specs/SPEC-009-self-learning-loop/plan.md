---
type: plan
version: 1
specId: SPEC-009
approach: "New LearningManager engine class with Zod schema, CLI command, GovernanceCompiler integration, slash command template, and init directory creation"
fileChanges:
  - path: "src/schemas/learning.ts"
    action: create
    description: "Zod schema for learning records (LearningFrontmatterSchema) with id, type, title, description, source, specId, tags, severity, author, timestamps"
  - path: "src/engine/LearningManager.ts"
    action: create
    description: "Engine class: create, list, search, delete, findRelevant methods — file-based storage in .primitiv/learnings/"
  - path: "src/engine/PrimitivEngine.ts"
    action: modify
    description: "Register LearningManager, expose as engine.learnings property"
  - path: "src/schemas/governance.ts"
    action: modify
    description: "Add learnings array to GovernanceContextSchema"
  - path: "src/engine/GovernanceCompiler.ts"
    action: modify
    description: "Read learnings from LearningManager, include in compiled context, add learnings/ to source hash"
  - path: "src/utils/ids.ts"
    action: modify
    description: "Add nextLearningId to StateFile interface, add nextLearningId() function"
  - path: "src/utils/fileSystem.ts"
    action: modify
    description: "Add learnings/ to ensurePrimitivDir directory list"
  - path: "src/commands/learn.ts"
    action: create
    description: "CLI command implementation for learn add|list|search|remove subcommands"
  - path: "src/cli.ts"
    action: modify
    description: "Register primitiv learn command with subcommands"
  - path: "src/index.ts"
    action: modify
    description: "Export LearningManager and learning schema types"
  - path: "templates/commands/primitiv.learn.md"
    action: create
    description: "Slash command template for /primitiv.learn (record + review subactions)"
  - path: "tests/learning.test.ts"
    action: create
    description: "Unit tests for LearningManager CRUD, filtering, search, delete, findRelevant"
  - path: "tests/learningSchema.test.ts"
    action: create
    description: "Unit tests for learning schema validation (valid/invalid records)"
  - path: "tests/governanceCompilerLearnings.test.ts"
    action: create
    description: "Unit tests for GovernanceCompiler learnings integration"
risks:
  - "GovernanceCompiler source hash change will invalidate existing cached governance-context.json (acceptable — auto-recompiles)"
  - "StateFile interface change requires backwards compatibility with existing .state.json files that lack nextLearningId"
  - "Free-form tags may lead to inconsistent tagging over time (accepted trade-off per clarification)"
dependencies: []
codebaseAnalysis:
  existingCode:
    - "AuditManager (src/engine/AuditManager.ts) — file-based JSONL storage pattern per spec"
    - "ResearchManager (src/engine/ResearchManager.ts) — markdown + frontmatter storage pattern"
    - "GovernanceCompiler (src/engine/GovernanceCompiler.ts) — compilation with source hash, cache, tryLoadSection pattern"
    - "SpecManager (src/engine/SpecManager.ts) — CRUD with state management and ID generation"
    - "fileSystem utils (src/utils/fileSystem.ts) — ensurePrimitivDir, writePrimitivFile, readPrimitivFile, primitivFileExists"
    - "ids utils (src/utils/ids.ts) — StateFile, loadState, saveState, nextSpecId, slugify"
  reusableModules:
    - "parseDocument / serializeDocument (src/utils/frontmatter.ts) — YAML frontmatter parsing for learning files"
    - "FrontmatterBaseSchema / TimestampSchema (src/schemas/common.ts) — base schema for learning frontmatter"
    - "slugify (src/utils/ids.ts) — generate file slugs from learning titles"
    - "writePrimitivFile / readPrimitivFile (src/utils/fileSystem.ts) — file I/O"
    - "getGitUser (src/git/gitGuard.ts) — author extraction"
    - "chalk (dependency) — CLI output formatting"
    - "cli-table3 (dependency) — table display for learn list"
  patternsToFollow:
    - "Engine class takes projectRoot in constructor (see AuditManager, ResearchManager)"
    - "Zod schema in src/schemas/ with z.infer<> type exports (see research.ts, audit.ts)"
    - "FrontmatterBaseSchema.extend() for new document types (see ResearchFrontmatterSchema)"
    - "CLI command in src/commands/ with runX function signature (see compile.ts, status.ts)"
    - "Commander subcommands via program.command().command() pattern (see migrate → speckit)"
    - "PrimitivEngine registers managers in constructor, exposes as public readonly properties"
    - "ensurePrimitivDir creates directories; init functions call it"
updatedAt: "2026-04-07T00:00:00Z"
---

# Technical Plan — SPEC-009: Self-Learning Loop

## Approach

Build a `LearningManager` engine class following the same patterns as `AuditManager` and `ResearchManager`. Learnings are stored as individual markdown files with YAML frontmatter in `.primitiv/learnings/`. The `GovernanceCompiler` is extended to read learnings and include them as a flat `learnings[]` array in the compiled governance context. A `primitiv learn` CLI command provides add/list/search/remove subcommands. A `/primitiv.learn` slash command template enables AI agents to record and review learnings.

## Codebase Analysis

### What Already Exists

The engine already has 8 manager classes following a consistent pattern: constructor takes `projectRoot`, methods operate on files inside `.primitiv/`. The `ResearchManager` is the closest analog — it stores structured markdown documents with YAML frontmatter per spec. The `LearningManager` follows the same pattern but stores files globally in `.primitiv/learnings/` rather than per-spec.

### Key Patterns to Follow

1. **Schema definition**: `FrontmatterBaseSchema.extend()` in `src/schemas/` (see `research.ts` lines 15-22)
2. **File storage**: `writePrimitivFile()` / `readPrimitivFile()` from `src/utils/fileSystem.ts`
3. **ID generation**: `loadState()` / `saveState()` from `src/utils/ids.ts` with `nextXxxId()` functions
4. **Engine registration**: Public readonly property in `PrimitivEngine` constructor (line 23-41)
5. **CLI commands**: `runX(projectRoot)` function in `src/commands/` (see `compile.ts`)
6. **Slash commands**: Markdown template in `templates/commands/` with instructions for AI agents

### What Needs to Be Built

All learning-specific code is new. No existing code handles cross-spec knowledge accumulation.

## File Changes

### 1. `src/schemas/learning.ts` (CREATE)
*Feature: Learning Record Management > all scenarios*

New Zod schema:

```typescript
export const LearningTypeSchema = z.enum(["best-practice", "error-resolution", "convention"]);
export const LearningSourceSchema = z.enum(["user", "gate-failure", "test-failure", "clarification", "review"]);
export const LearningSeveritySchema = z.enum(["info", "important", "critical"]);

export const LearningFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("learning"),
  id: z.string().regex(/^LEARN-\d+$/),
  learningType: LearningTypeSchema,      // "type" is taken by FrontmatterBase
  title: z.string().min(1),
  source: LearningSourceSchema,
  specId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  severity: LearningSeveritySchema.default("info"),
  author: z.string().default("system"),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
```

Note: The frontmatter `type` field is always `"learning"` (from `FrontmatterBaseSchema`). The learning category (best-practice, error-resolution, convention) uses `learningType` to avoid collision.

### 2. `src/engine/LearningManager.ts` (CREATE)
*Feature: Learning Record Management > all scenarios*

```
class LearningManager {
  constructor(projectRoot: string)

  create(opts: { learningType, title, description, source?, specId?, tags?, severity? }): LearningRecord
  list(filter?: { learningType?, tag?, severity?, source? }): LearningRecord[]
  get(id: string): LearningRecord | null
  search(query: string): LearningRecord[]
  delete(id: string): boolean
  findRelevant(keywords: string[]): LearningRecord[]

  // Internal
  private learningsDir(): string        // .primitiv/learnings/
  private readAllLearnings(): LearningRecord[]
  private buildFilename(id: string, title: string): string  // uses slugify
}
```

- `create()`: Reads nextLearningId from state, creates `LEARN-XXX-slug.md` with frontmatter + description body, increments state counter
- `list()`: Reads all `.md` files from `learningsDir()`, parses frontmatter, applies optional filters, sorts by createdAt descending
- `search()`: Case-insensitive substring match on title + description (markdown body)
- `delete()`: Finds file matching the ID prefix, removes it with `unlinkSync`
- `findRelevant()`: Returns learnings where any tag matches any keyword (case-insensitive)

### 3. `src/engine/PrimitivEngine.ts` (MODIFY)
*Feature: Learning Record Management > Background*

- Import `LearningManager`
- Add `public readonly learnings: LearningManager` property
- Initialize in constructor: `this.learnings = new LearningManager(projectRoot)`

### 4. `src/schemas/governance.ts` (MODIFY)
*Feature: Governance Context Integration > Learnings included in compiled governance context*

Add to `GovernanceContextSchema`:
```typescript
learnings: z.array(LearningFrontmatterSchema.extend({
  description: z.string().default(""),
})).default([]),
```

The `description` field carries the markdown body content — not part of the frontmatter schema but needed in the compiled context.

### 5. `src/engine/GovernanceCompiler.ts` (MODIFY)
*Feature: Governance Context Integration > both scenarios*

- Import `LearningManager`
- In `compile()`: Instantiate `LearningManager`, call `list()`, map to context format, include in returned object
- In `computeSourceHash()`: Add learnings directory contents to hash so changes trigger recompilation
- Add `"learnings/"` to watched paths
- Bump `COMPILER_VERSION` to `"1.2"`

### 6. `src/utils/ids.ts` (MODIFY)
*Feature: Learning Record Management > User adds a best practice learning (nextLearningId incremented)*

- Add `nextLearningId?: number` to `StateFile` interface (optional for backwards compatibility)
- Add `nextLearningId(projectRoot: string): string` function following `nextSpecId` pattern
- Default to 1 when field is missing from existing state files

### 7. `src/utils/fileSystem.ts` (MODIFY)
*Feature: Init Integration > Learnings directory created on init*

- Add `join(root, "learnings")` to the `dirs` array in `ensurePrimitivDir()`

### 8. `src/commands/learn.ts` (CREATE)
*Feature: CLI Learn Command > all scenarios*

```typescript
export async function runLearnAdd(projectRoot: string, options: {
  type: string; title: string; description?: string; tags?: string; severity?: string;
}): Promise<void>

export async function runLearnList(projectRoot: string, options: {
  type?: string; tag?: string;
}): Promise<void>

export async function runLearnSearch(projectRoot: string, query: string): Promise<void>

export async function runLearnRemove(projectRoot: string, id: string): Promise<void>
```

- `runLearnAdd`: Validates inputs, calls `engine.learnings.create()`, prints success with learning ID
- `runLearnList`: Calls `engine.learnings.list()`, renders cli-table3 table (ID, Type, Title, Severity, Tags)
- `runLearnSearch`: Calls `engine.learnings.search()`, displays results with matched context
- `runLearnRemove`: Calls `engine.learnings.delete()`, prints confirmation or "not found" error

### 9. `src/cli.ts` (MODIFY)
*Feature: CLI Learn Command > all scenarios*

Add `learn` command group with subcommands:
```typescript
const learn = program.command("learn").description("Manage project learnings");

learn.command("add")
  .requiredOption("--type <type>", "best-practice | error-resolution | convention")
  .requiredOption("--title <title>", "Learning title")
  .option("--description <desc>", "Detailed description")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--severity <level>", "info | important | critical", "info")
  .option("--spec <specId>", "Link to originating spec")
  .action(...)

learn.command("list")
  .option("--type <type>", "Filter by type")
  .option("--tag <tag>", "Filter by tag")
  .action(...)

learn.command("search")
  .argument("<query>", "Search keyword")
  .action(...)

learn.command("remove")
  .argument("<id>", "Learning ID (e.g., LEARN-001)")
  .action(...)
```

### 10. `src/index.ts` (MODIFY)
*SDK exports*

Add exports:
```typescript
export { LearningManager } from "./engine/LearningManager.js";
export * from "./schemas/learning.js";
```

### 11. `templates/commands/primitiv.learn.md` (CREATE)
*Feature: Slash Command Integration > both scenarios*

Slash command template instructing AI agents to:
1. Parse arguments — if text provided, record a new learning; if "review", list relevant learnings
2. For recording: extract type, title, description, tags from the user's input; detect source from context (e.g., if on a spec branch, link specId; if after gate failure, set source to "gate-failure")
3. For reviewing: read the current spec, extract keywords from title/description, call `findRelevant()`, display matching learnings
4. Write learning files directly using the schema format (AI agents don't have CLI access, they write files)

### 12. Pipeline Template Updates (MODIFY)
*Feature: Pipeline Learning Surfacing > Relevant learnings shown in pipeline commands*

Add a "Relevant Learnings" step to these templates:
- `templates/commands/primitiv.specify.md` — after loading context, read learnings, show relevant ones based on spec keywords
- `templates/commands/primitiv.plan.md` — include learnings in planning context
- `templates/commands/primitiv.implement.md` — surface learnings as implementation reminders
- `templates/commands/primitiv.test-feature.md` — show error-resolution learnings

Each template gets a small addition: "Read `.primitiv/learnings/*.md` files, match tags against spec keywords, display relevant learnings as context."

### 13. Test Files (CREATE)

#### `tests/learning.test.ts`
*Feature: Learning Record Management > all scenarios*

- Test `create()` produces correct file with frontmatter and body
- Test ID auto-increment via state file
- Test `list()` returns all learnings sorted by createdAt desc
- Test `list()` with type/tag/severity filters
- Test `search()` matches title and description
- Test `delete()` removes file and subsequent list excludes it
- Test `findRelevant()` matches tags against keywords
- Test error cases (delete non-existent, empty list)

#### `tests/learningSchema.test.ts`
*Feature: Learning Record Management > Background*

- Test valid learning record passes schema
- Test missing required fields fail
- Test invalid learningType/source/severity fail
- Test default values (severity="info", tags=[], specId=null)
- Test ID format validation (LEARN-XXX)

#### `tests/governanceCompilerLearnings.test.ts`
*Feature: Governance Context Integration > both scenarios*

- Test compiled context includes `learnings` array when learnings exist
- Test compiled context has empty `learnings` array when none exist
- Test source hash changes when learnings are added
- Test `isStale()` detects learning changes

## Architecture

```
PrimitivEngine
├── GateManager
├── ConstitutionManager
├── SpecManager
├── FeatureRegistryManager
├── AuditManager
├── ResearchManager
├── ContractManager
├── GovernanceCompiler ──reads──→ LearningManager
└── LearningManager (NEW)
         │
         ▼
  .primitiv/learnings/
  ├── LEARN-001-always-validate-env-vars.md
  ├── LEARN-002-fix-circular-dependency.md
  └── ...
```

The `LearningManager` sits alongside existing managers. The `GovernanceCompiler` reads from it during compilation. The CLI and slash commands interact through `PrimitivEngine.learnings`.

## Risks

1. **State file backwards compatibility** — Existing `.state.json` files lack `nextLearningId`. Mitigated by making the field optional and defaulting to 1 when absent.
2. **Governance cache invalidation** — Adding learnings to the source hash means the first `compile` after this change will recompile. This is expected and harmless.
3. **Free-form tag inconsistency** — Users may create tags like "test", "tests", "testing" for the same concept. Accepted trade-off per clarification. Future enhancement could add tag suggestions.

## Dependencies

None — no new external dependencies required. All needed packages (chalk, cli-table3, commander, zod, gray-matter) are already installed.
