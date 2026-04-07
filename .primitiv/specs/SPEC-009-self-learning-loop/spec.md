---
type: spec
id: SPEC-009
title: "Self-Learning Loop"
status: completed
version: 2
branch: "spec/SPEC-009-self-learning-loop"
author: "Dieu"
createdAt: "2026-04-07T00:00:00Z"
updatedAt: "2026-04-07T00:00:00Z"
---

# SPEC-009: Self-Learning Loop

## Description

Integrate a built-in mechanism for capturing, storing, and surfacing project-level learnings across the Primitiv pipeline. The self-learning loop enables two categories of knowledge accumulation:

1. **Best practices introduced by the user** — explicit rules, conventions, or patterns the user wants enforced in future specs, plans, and implementations.
2. **Error-driven learnings** — when a gate check fails, a test fails, or a spec requires multiple clarification rounds, the system captures the root cause and resolution so the same mistake is not repeated.

Learnings are persisted as structured records in `.primitiv/learnings/` and automatically injected into the governance context so that AI agents operating within the pipeline have access to accumulated project knowledge. This creates a feedback loop where the project gets smarter over time.

## Current Behavior

- **AuditManager** (`src/engine/AuditManager.ts`) records spec state transitions (SPEC_CREATED, GATE_CHECK_PASSED, GATE_CHECK_FAILED, STATUS_CHANGED) as JSONL audit logs per spec. It tracks *what happened* but not *why it happened* or *what was learned*.
- **ResearchManager** (`src/engine/ResearchManager.ts`) stores research decisions with alternatives and rationale per spec, but these are scoped to individual specs and not surfaced across future work.
- **GovernanceCompiler** (`src/engine/GovernanceCompiler.ts`) compiles gates and constitutions into a `GovernanceContext` JSON blob with normalized constraints. It currently has no mechanism to include project-level learnings.
- **Validation results** from `gateValidator.ts`, `constitutionValidator.ts`, and `specAlignment.ts` return `violations[]` and `warnings[]` arrays, but these are consumed and discarded — not aggregated for pattern detection.
- **Test results schema** (`src/schemas/testResults.ts`) records pass/fail counts but not failure reasons or resolutions.
- **No slash command** exists for capturing feedback, retrospectives, or best practices.

## Proposed Changes

### 1. Learning Schema (`src/schemas/learning.ts`)

Define a Zod schema for learning records with:
- `id` — unique identifier (e.g., `LEARN-001`)
- `type` — `"best-practice"` | `"error-resolution"` | `"convention"`
- `title` — short descriptive title
- `description` — detailed explanation of the learning
- `source` — what triggered it: `"user"` | `"gate-failure"` | `"test-failure"` | `"clarification"` | `"review"`
- `specId` — optional link to the originating spec
- `tags` — free-form categorization tags (e.g., `["testing", "schema-design"]`)
- `severity` — `"info"` | `"important"` | `"critical"`
- `createdAt` / `updatedAt` — timestamps
- `author` — git user who recorded the learning

### 2. LearningManager (`src/engine/LearningManager.ts`)

New engine class that:
- **Stores learnings** in `.primitiv/learnings/` as individual markdown files with YAML frontmatter (consistent with existing spec/gate/constitution pattern)
- **Lists learnings** with filtering by type, tag, severity, and source
- **Searches learnings** by keyword across titles and descriptions
- **Manages IDs** via a counter in `.state.json` (`nextLearningId`)
- **Provides relevant learnings** given a context query (tag-based matching against spec keywords for inclusion in governance context)
- **Deletes learnings** by ID (removes the file from `.primitiv/learnings/`)

### 3. GovernanceCompiler Integration

Extend `GovernanceCompiler.compile()` to:
- Read all learning records from `.primitiv/learnings/`
- Include a `learnings` section in the compiled `GovernanceContext`
- Add a top-level `learnings` array to the `GovernanceContext` schema (flat list, not merged into constraints)
- Bump `COMPILER_VERSION`

### 4. CLI Command (`primitiv learn`)

New CLI command with subcommands:
- `primitiv learn add` — interactively capture a new learning (prompts for type, title, description, tags, severity)
- `primitiv learn list` — display all learnings, optionally filtered
- `primitiv learn search <query>` — search learnings by keyword
- `primitiv learn remove <id>` — delete a learning by ID

### 5. Slash Command Template (`/primitiv.learn`)

New slash command that AI agents can invoke to:
- Record a best practice or convention introduced by the user
- Capture an error resolution after debugging
- Review existing learnings relevant to the current spec

### 6. Pipeline Integration

Update existing slash command templates to surface relevant learnings:
- `/primitiv.specify` — show relevant learnings when creating a new spec
- `/primitiv.plan` — include learnings in the planning context
- `/primitiv.implement` — surface learnings as warnings/reminders during implementation
- `/primitiv.test-feature` — show past test failure learnings

### 7. PrimitivEngine Integration

Register `LearningManager` in `PrimitivEngine` alongside existing managers. Expose via `engine.learnings` accessor.

## Acceptance Criteria

### Feature: Learning Record Management

Handles creation, storage, retrieval, and search of project-level learning records.

#### Background:
  Given Primitiv is initialized in a project directory
  And the `.primitiv/learnings/` directory exists

#### Scenario: User adds a best practice learning
  Given no learnings exist yet
  When the user creates a learning with type "best-practice", title "Always validate env vars at startup", and tags ["validation", "configuration"]
  Then a file `LEARN-001-always-validate-env-vars-at-startup.md` is created in `.primitiv/learnings/`
  And the file contains YAML frontmatter with id "LEARN-001", type "best-practice", and source "user"
  And the file contains the description in the markdown body
  And `.primitiv/.state.json` nextLearningId is incremented to 2

#### Scenario: User adds an error-resolution learning linked to a spec
  Given learning LEARN-001 already exists
  When the user creates a learning with type "error-resolution", title "Fix circular dependency in GovernanceCompiler", source "gate-failure", and specId "SPEC-005"
  Then a file `LEARN-002-fix-circular-dependency-in-governancecompiler.md` is created
  And the frontmatter includes specId "SPEC-005"
  And nextLearningId is incremented to 3

#### Scenario: List all learnings
  Given learnings LEARN-001 and LEARN-002 exist
  When the user lists all learnings
  Then both learnings are returned sorted by creation date (newest first)
  And each entry includes id, type, title, severity, tags, and createdAt

#### Scenario: Filter learnings by type
  Given learnings of types "best-practice" and "error-resolution" exist
  When the user lists learnings filtered by type "best-practice"
  Then only best-practice learnings are returned

#### Scenario: Search learnings by keyword
  Given a learning with title "Always validate env vars at startup" and description containing "Zod schema"
  When the user searches for "Zod"
  Then the learning is returned in the results

#### Scenario: Delete a learning by ID
  Given learning LEARN-001 exists
  When the user deletes learning "LEARN-001"
  Then the file `LEARN-001-always-validate-env-vars-at-startup.md` is removed from `.primitiv/learnings/`
  And subsequent list calls do not include LEARN-001

### Feature: Governance Context Integration

Learnings are compiled into the governance context so AI agents have access to accumulated project knowledge.

#### Background:
  Given Primitiv is initialized with gates and constitutions defined
  And at least one learning record exists with tags ["code", "testing"]

#### Scenario: Learnings included in compiled governance context
  Given a learning with type "best-practice" and tags ["code"] exists
  When the GovernanceCompiler compiles the governance context
  Then the output JSON contains a `learnings` array
  And the learning appears in the `learnings` array with its title, description, type, and tags

#### Scenario: Governance context cache invalidated when learnings change
  Given a cached governance-context.json exists
  And the user adds a new learning
  When the GovernanceCompiler checks if recompilation is needed
  Then it detects the learnings have changed and recompiles

### Feature: CLI Learn Command

Provides a command-line interface for managing learnings.

#### Scenario: Add learning via CLI
  Given Primitiv is initialized
  When the user runs `primitiv learn add` with --type "best-practice" --title "Use semantic HTML" --tags "accessibility,ui" --severity "important"
  Then a new learning file is created in `.primitiv/learnings/`
  And a success message is printed with the learning ID

#### Scenario: List learnings via CLI
  Given multiple learnings exist
  When the user runs `primitiv learn list`
  Then a formatted table of learnings is displayed
  And the table includes columns for ID, Type, Title, Severity, and Tags

#### Scenario: Search learnings via CLI
  Given learnings exist with various titles and descriptions
  When the user runs `primitiv learn search "validation"`
  Then matching learnings are displayed with highlighted search terms

#### Scenario: Remove learning via CLI
  Given learning LEARN-001 exists
  When the user runs `primitiv learn remove LEARN-001`
  Then the learning file is deleted
  And a success message confirms removal

#### Scenario: Error when no learnings found
  Given no learnings exist
  When the user runs `primitiv learn list`
  Then a message "No learnings recorded yet" is displayed
  And a hint to use `primitiv learn add` is shown

### Feature: Slash Command Integration

The `/primitiv.learn` slash command enables AI agents to capture and retrieve learnings during pipeline execution.

#### Scenario: AI agent records a learning after error resolution
  Given the AI agent has resolved a gate validation failure
  When the agent invokes `/primitiv.learn` with the error details and resolution
  Then a new learning of type "error-resolution" is created
  And it includes the specId of the current spec
  And the source is set to "gate-failure"

#### Scenario: Relevant learnings surfaced during spec creation
  Given learnings with tags ["api", "validation"] exist
  When the user creates a new spec related to API validation
  Then the specify command shows a "Relevant Learnings" section
  And it lists learnings matching the spec's domain

### Feature: Pipeline Learning Surfacing

Existing pipeline commands surface relevant learnings to prevent repeated mistakes.

#### Scenario Outline: Relevant learnings shown in pipeline commands
  Given a learning with tags [<tags>] exists
  When the user runs <command> for a spec in the <domain> domain
  Then the command output includes a "Relevant Learnings" section with matching learnings

  Examples:
  | tags               | command             | domain         |
  | ["testing"]        | /primitiv.plan      | testing        |
  | ["security"]       | /primitiv.specify   | authentication |
  | ["database"]       | /primitiv.implement | data-layer     |

### Feature: Init Integration

The `primitiv init` command creates the learnings directory as part of project initialization.

#### Scenario: Learnings directory created on init
  Given a project directory with no `.primitiv/` folder
  When the user runs `primitiv init`
  Then `.primitiv/learnings/` directory is created alongside `specs/`, `gates/`, and `constitutions/`

#### Scenario: Init with existing learnings directory
  Given `.primitiv/learnings/` already exists
  When the user runs `primitiv init`
  Then the existing learnings directory is preserved
  And no learnings are lost

## Test Strategy

- **Unit tests**: LearningManager CRUD operations, ID generation, filtering, search logic
- **Unit tests**: Learning schema validation (valid/invalid records)
- **Unit tests**: GovernanceCompiler learnings integration (compilation output includes learnings)
- **Integration tests**: CLI `learn` command (add, list, search) with real file system
- **Integration tests**: End-to-end flow — add learning, compile governance, verify inclusion

## Constraints

- Learning records use the same file-based storage pattern as specs (markdown + YAML frontmatter) — no database required
- Learnings are project-scoped (stored in `.primitiv/learnings/`) and tracked in version control
- The learning schema must be defined as a Zod schema consistent with existing schemas in `src/schemas/`
- GovernanceCompiler version must be bumped when learnings integration is added
- Search is keyword-based (simple string matching) — no vector/embedding search required at this stage

## Out of Scope

- Automatic learning extraction from audit logs (future enhancement — requires pattern detection heuristics)
- Cross-project learning sharing (learnings are project-local only)
- AI-powered learning suggestions (no LLM integration for suggesting learnings)
- Learning approval workflow (all learnings are immediately active)
- Learning versioning or edit history (learnings can be updated in-place)
- Analytics dashboard for learning trends
