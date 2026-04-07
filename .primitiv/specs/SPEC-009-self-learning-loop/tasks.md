---
type: tasks
version: 1
specId: SPEC-009
tasks:
  - id: TASK-001
    title: "Create learning Zod schema and schema tests"
    description: "Define LearningFrontmatterSchema with all fields (id, learningType, title, source, specId, tags, severity, author, timestamps) in src/schemas/learning.ts. Write schema validation tests."
    status: completed
    files:
      - "src/schemas/learning.ts"
      - "tests/learningSchema.test.ts"
    acceptanceCriteria:
      - "Feature: Learning Record Management > Scenario: User adds a best practice learning"
      - "Feature: Learning Record Management > Scenario: User adds an error-resolution learning linked to a spec"
    dependsOn: []
  - id: TASK-002
    title: "Add nextLearningId to state file utility"
    description: "Add optional nextLearningId field to StateFile interface in src/utils/ids.ts. Add nextLearningId() function following the nextSpecId pattern. Default to 1 when field is missing for backwards compatibility."
    status: completed
    files:
      - "src/utils/ids.ts"
    acceptanceCriteria:
      - "Feature: Learning Record Management > Scenario: User adds a best practice learning"
    dependsOn: []
  - id: TASK-003
    title: "Add learnings/ directory to ensurePrimitivDir"
    description: "Add join(root, 'learnings') to the dirs array in ensurePrimitivDir() in src/utils/fileSystem.ts so primitiv init creates the learnings directory."
    status: completed
    files:
      - "src/utils/fileSystem.ts"
    acceptanceCriteria:
      - "Feature: Init Integration > Scenario: Learnings directory created on init"
      - "Feature: Init Integration > Scenario: Init with existing learnings directory"
    dependsOn: []
  - id: TASK-004
    title: "Implement LearningManager engine class and tests"
    description: "Create LearningManager with create(), list(), get(), search(), delete(), and findRelevant() methods. Store learnings as markdown files with YAML frontmatter in .primitiv/learnings/. Write comprehensive unit tests covering all CRUD operations, filtering, search, delete, and findRelevant."
    status: completed
    files:
      - "src/engine/LearningManager.ts"
      - "tests/learning.test.ts"
    acceptanceCriteria:
      - "Feature: Learning Record Management > Scenario: User adds a best practice learning"
      - "Feature: Learning Record Management > Scenario: User adds an error-resolution learning linked to a spec"
      - "Feature: Learning Record Management > Scenario: List all learnings"
      - "Feature: Learning Record Management > Scenario: Filter learnings by type"
      - "Feature: Learning Record Management > Scenario: Search learnings by keyword"
      - "Feature: Learning Record Management > Scenario: Delete a learning by ID"
    dependsOn:
      - "TASK-001"
      - "TASK-002"
  - id: TASK-005
    title: "Register LearningManager in PrimitivEngine"
    description: "Import LearningManager, add public readonly learnings property, initialize in constructor."
    status: completed
    files:
      - "src/engine/PrimitivEngine.ts"
    acceptanceCriteria:
      - "Feature: Learning Record Management > Background"
    dependsOn:
      - "TASK-004"
  - id: TASK-006
    title: "Integrate learnings into GovernanceCompiler and tests"
    description: "Add learnings array to GovernanceContextSchema in governance.ts. Modify GovernanceCompiler.compile() to read learnings via LearningManager and include in output. Add learnings/ to computeSourceHash(). Bump COMPILER_VERSION to 1.2. Write tests for learnings in compiled context and cache invalidation."
    status: completed
    files:
      - "src/schemas/governance.ts"
      - "src/engine/GovernanceCompiler.ts"
      - "tests/governanceCompilerLearnings.test.ts"
    acceptanceCriteria:
      - "Feature: Governance Context Integration > Scenario: Learnings included in compiled governance context"
      - "Feature: Governance Context Integration > Scenario: Governance context cache invalidated when learnings change"
    dependsOn:
      - "TASK-004"
  - id: TASK-007
    title: "Implement CLI learn command and register in CLI"
    description: "Create src/commands/learn.ts with runLearnAdd, runLearnList, runLearnSearch, runLearnRemove functions. Register the learn command group with add/list/search/remove subcommands in src/cli.ts."
    status: completed
    files:
      - "src/commands/learn.ts"
      - "src/cli.ts"
    acceptanceCriteria:
      - "Feature: CLI Learn Command > Scenario: Add learning via CLI"
      - "Feature: CLI Learn Command > Scenario: List learnings via CLI"
      - "Feature: CLI Learn Command > Scenario: Search learnings via CLI"
      - "Feature: CLI Learn Command > Scenario: Remove learning via CLI"
      - "Feature: CLI Learn Command > Scenario: Error when no learnings found"
    dependsOn:
      - "TASK-005"
  - id: TASK-008
    title: "Add SDK exports for LearningManager and schema"
    description: "Export LearningManager class and all learning schema types from src/index.ts."
    status: completed
    files:
      - "src/index.ts"
    acceptanceCriteria:
      - "Feature: Learning Record Management > Background"
    dependsOn:
      - "TASK-004"
  - id: TASK-009
    title: "Create /primitiv.learn slash command template"
    description: "Create templates/commands/primitiv.learn.md with instructions for AI agents to record learnings (from description text) and review relevant learnings (with 'review' subaction). Template should detect context (spec branch, gate failure) to set source and specId automatically."
    status: completed
    files:
      - "templates/commands/primitiv.learn.md"
    acceptanceCriteria:
      - "Feature: Slash Command Integration > Scenario: AI agent records a learning after error resolution"
      - "Feature: Slash Command Integration > Scenario: Relevant learnings surfaced during spec creation"
    dependsOn:
      - "TASK-001"
  - id: TASK-010
    title: "Update pipeline slash command templates to surface learnings"
    description: "Add a 'Relevant Learnings' step to primitiv.specify.md, primitiv.plan.md, primitiv.implement.md, and primitiv.test-feature.md. Each template reads .primitiv/learnings/*.md, matches tags against spec keywords, and displays relevant learnings as context."
    status: completed
    files:
      - "templates/commands/primitiv.specify.md"
      - "templates/commands/primitiv.plan.md"
      - "templates/commands/primitiv.implement.md"
      - "templates/commands/primitiv.test-feature.md"
    acceptanceCriteria:
      - "Feature: Pipeline Learning Surfacing > Scenario Outline: Relevant learnings shown in pipeline commands"
    dependsOn:
      - "TASK-001"
updatedAt: "2026-04-07T00:00:00Z"
---

# Tasks — SPEC-009: Self-Learning Loop

## TASK-001: Create learning Zod schema and schema tests
**Status:** pending | **Depends on:** none

Define `LearningFrontmatterSchema` in `src/schemas/learning.ts` with:
- `LearningTypeSchema`: `"best-practice" | "error-resolution" | "convention"`
- `LearningSourceSchema`: `"user" | "gate-failure" | "test-failure" | "clarification" | "review"`
- `LearningSeveritySchema`: `"info" | "important" | "critical"`
- Full frontmatter: id (LEARN-XXX), learningType, title, source, specId (nullable), tags (free-form string[]), severity, author, createdAt, updatedAt

Write `tests/learningSchema.test.ts` with valid/invalid schema validation tests, default values, and ID format checks.

**Files:** `src/schemas/learning.ts`, `tests/learningSchema.test.ts`

---

## TASK-002: Add nextLearningId to state file utility
**Status:** pending | **Depends on:** none

In `src/utils/ids.ts`:
- Add `nextLearningId?: number` to `StateFile` interface (optional for backwards compat)
- Add `nextLearningId(projectRoot: string): string` function (generates `LEARN-001`, increments counter)
- Default to 1 when field missing from existing `.state.json`

**Files:** `src/utils/ids.ts`

---

## TASK-003: Add learnings/ directory to ensurePrimitivDir
**Status:** pending | **Depends on:** none

In `src/utils/fileSystem.ts`:
- Add `join(root, "learnings")` to the `dirs` array in `ensurePrimitivDir()`

**Files:** `src/utils/fileSystem.ts`

---

## TASK-004: Implement LearningManager engine class and tests
**Status:** pending | **Depends on:** TASK-001, TASK-002

Create `src/engine/LearningManager.ts`:
- `create()` — generate ID via `nextLearningId()`, write markdown file with frontmatter + description body
- `list()` — read all `.md` files from `.primitiv/learnings/`, parse frontmatter, filter, sort by createdAt desc
- `get()` — find single learning by ID
- `search()` — case-insensitive substring match on title + description
- `delete()` — find and remove file by ID prefix
- `findRelevant()` — match learning tags against provided keywords (case-insensitive)

Write `tests/learning.test.ts` with comprehensive tests for all methods.

**Files:** `src/engine/LearningManager.ts`, `tests/learning.test.ts`

---

## TASK-005: Register LearningManager in PrimitivEngine
**Status:** pending | **Depends on:** TASK-004

In `src/engine/PrimitivEngine.ts`:
- Import `LearningManager`
- Add `public readonly learnings: LearningManager`
- Initialize `this.learnings = new LearningManager(projectRoot)` in constructor

**Files:** `src/engine/PrimitivEngine.ts`

---

## TASK-006: Integrate learnings into GovernanceCompiler and tests
**Status:** pending | **Depends on:** TASK-004

In `src/schemas/governance.ts`:
- Add `learnings` field to `GovernanceContextSchema` as flat array with description

In `src/engine/GovernanceCompiler.ts`:
- Read learnings via `LearningManager.list()`
- Include as `learnings[]` in compiled output
- Add `learnings/` directory contents to `computeSourceHash()`
- Bump `COMPILER_VERSION` to `"1.2"`

Write `tests/governanceCompilerLearnings.test.ts`.

**Files:** `src/schemas/governance.ts`, `src/engine/GovernanceCompiler.ts`, `tests/governanceCompilerLearnings.test.ts`

---

## TASK-007: Implement CLI learn command and register in CLI
**Status:** pending | **Depends on:** TASK-005

Create `src/commands/learn.ts`:
- `runLearnAdd()` — validate inputs, create learning, print success
- `runLearnList()` — list learnings in cli-table3 table (ID, Type, Title, Severity, Tags)
- `runLearnSearch()` — search and display matches
- `runLearnRemove()` — delete learning, print confirmation

In `src/cli.ts`:
- Register `learn` command group with `add`, `list`, `search`, `remove` subcommands

**Files:** `src/commands/learn.ts`, `src/cli.ts`

---

## TASK-008: Add SDK exports for LearningManager and schema
**Status:** pending | **Depends on:** TASK-004

In `src/index.ts`:
- Export `LearningManager` from engine
- Export all types from `src/schemas/learning.ts`

**Files:** `src/index.ts`

---

## TASK-009: Create /primitiv.learn slash command template
**Status:** pending | **Depends on:** TASK-001

Create `templates/commands/primitiv.learn.md`:
- Record mode: parse description, detect type/tags/source from context
- Review mode: read current spec, extract keywords, find relevant learnings
- Auto-detect specId from branch, source from pipeline stage

**Files:** `templates/commands/primitiv.learn.md`

---

## TASK-010: Update pipeline slash command templates to surface learnings
**Status:** pending | **Depends on:** TASK-001

Add "Relevant Learnings" section to:
- `primitiv.specify.md` — show learnings when creating specs
- `primitiv.plan.md` — include in planning context
- `primitiv.implement.md` — surface as implementation reminders
- `primitiv.test-feature.md` — show past test failure learnings

Each reads `.primitiv/learnings/*.md`, matches tags, displays relevant ones.

**Files:** `templates/commands/primitiv.specify.md`, `templates/commands/primitiv.plan.md`, `templates/commands/primitiv.implement.md`, `templates/commands/primitiv.test-feature.md`
