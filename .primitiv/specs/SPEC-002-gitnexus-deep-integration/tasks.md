---
type: tasks
version: 1
specId: SPEC-002
tasks:
  - id: TASK-001
    title: "Add .gitnexus/ to .gitignore"
    description: "Add .gitnexus/ to .gitignore so the machine-local index is never committed"
    status: completed
    files: [".gitignore"]
    acceptanceCriteria:
      - ".gitignore contains a .gitnexus/ entry"
      - "Existing ignore rules remain unchanged"
  - id: TASK-002
    title: "Run GitNexus analyze and setup"
    description: "Execute npx gitnexus analyze to index the repo, then npx gitnexus setup to auto-install core skills, hooks, and validate MCP config for Claude Code"
    status: completed
    files: [".gitnexus/", ".claude/skills/"]
    acceptanceCriteria:
      - ".gitnexus/ directory exists with index data"
      - ".claude/skills/ directory exists with GitNexus core skills (exploring, debugging, impact analysis, refactoring)"
      - "Community-specific skills are generated"
      - "PostToolUse hooks for auto-reindexing are installed"
      - ".mcp.json is unchanged after setup (verify git diff)"
  - id: TASK-003
    title: "Enhance primitiv.plan.md GitNexus references"
    description: "Enhance the existing Step 2 GitNexus section with per-sub-step tool specificity: query for finding related implementations, context for symbol deep-dives, impact for blast radius of planned changes"
    status: completed
    files: [".claude/commands/primitiv.plan.md"]
    acceptanceCriteria:
      - "Step 2 specifies when to use query vs context vs impact"
      - "Existing manual fallback section is preserved"
      - "Command still works correctly without GitNexus"
  - id: TASK-004
    title: "Add GitNexus section to primitiv.tasks.md"
    description: "Insert a codebase analysis step between Load context and Generate tasks that uses GitNexus impact and context tools to identify per-task file dependencies and blast radius, with manual fallback"
    status: completed
    files: [".claude/commands/primitiv.tasks.md"]
    acceptanceCriteria:
      - "New step references gitnexus.impact for blast radius per planned file change"
      - "New step references gitnexus.context for understanding symbol coupling"
      - "Manual fallback using Glob/Grep is included"
      - "Existing task generation instructions are unchanged"
  - id: TASK-005
    title: "Enhance primitiv.implement.md GitNexus references"
    description: "Expand the existing brief gitnexus.context reference into a structured section: context + impact before modifying files, detect_changes after all tasks complete, with manual fallback"
    status: completed
    files: [".claude/commands/primitiv.implement.md"]
    acceptanceCriteria:
      - "References gitnexus.context and gitnexus.impact before code changes"
      - "References gitnexus.detect_changes after implementation completes"
      - "Manual fallback using Glob/Grep/git-diff is included"
      - "Existing implementation instructions are unchanged"
  - id: TASK-006
    title: "Add GitNexus section to primitiv.test-feature.md"
    description: "Insert a test boundary discovery step before test generation that uses GitNexus query to find existing tests and related code, context for caller/callee analysis, and impact for affected code paths"
    status: completed
    files: [".claude/commands/primitiv.test-feature.md"]
    acceptanceCriteria:
      - "New step references gitnexus.query for finding existing tests and related code"
      - "New step references gitnexus.context for understanding integration boundaries"
      - "New step references gitnexus.impact for complete test coverage of affected paths"
      - "Manual fallback using Glob/Grep is included"
      - "Existing test generation and execution instructions are unchanged"
  - id: TASK-007
    title: "Add GitNexus section to primitiv.compushpr.md"
    description: "Add an impact analysis step before PR creation that uses GitNexus detect_changes to map affected processes and dependencies, included in the PR body"
    status: completed
    files: [".claude/commands/primitiv.compushpr.md"]
    acceptanceCriteria:
      - "New step references gitnexus.detect_changes for impact analysis"
      - "Manual fallback using git diff --stat is included"
      - "PR body template includes an Impact Analysis section"
      - "Existing commit/push/merge instructions are unchanged"
updatedAt: "2026-03-15T10:25:00Z"
---

# Tasks — SPEC-002: GitNexus Deep Integration

## TASK-001: Add .gitnexus/ to .gitignore

**Status:** pending

Add `.gitnexus/` to `.gitignore` so the machine-local index is never committed. This must be done before running `npx gitnexus analyze` to prevent accidentally staging the index.

**Files:** `.gitignore`

**Acceptance Criteria:**
- [ ] `.gitignore` contains a `.gitnexus/` entry
- [ ] Existing ignore rules remain unchanged

---

## TASK-002: Run GitNexus analyze and setup

**Status:** pending

Execute the two-command initialization workflow:

1. `npx gitnexus analyze --skills` — Index the repo and generate community-specific skills
2. `npx gitnexus setup` — Auto-install core skills, hooks, and validate MCP config for Claude Code

After setup, verify that `.mcp.json` was not overwritten.

**Files:** `.gitnexus/` (generated), `.claude/skills/` (generated)

**Acceptance Criteria:**
- [ ] `.gitnexus/` directory exists with index data
- [ ] `.claude/skills/` directory exists with GitNexus core skills (exploring, debugging, impact analysis, refactoring)
- [ ] Community-specific skills are generated
- [ ] PostToolUse hooks for auto-reindexing are installed
- [ ] `.mcp.json` is unchanged after setup (verify with `git diff .mcp.json`)

---

## TASK-003: Enhance primitiv.plan.md GitNexus references

**Status:** pending

The existing Step 2 already lists `query`, `context`, `impact` generically. Enhance with per-sub-step specificity so the agent knows exactly which tool to call at each planning stage:

- Searching for related implementations → `query`
- Understanding a specific symbol → `context`
- Assessing blast radius of planned changes → `impact`

Keep the existing manual fallback section unchanged.

**Files:** `.claude/commands/primitiv.plan.md`

**Acceptance Criteria:**
- [ ] Step 2 specifies when to use `query` vs `context` vs `impact`
- [ ] Existing manual fallback section is preserved
- [ ] Command still works correctly without GitNexus

---

## TASK-004: Add GitNexus section to primitiv.tasks.md

**Status:** pending

Insert a new codebase analysis step between "Load context" (Step 1) and "Generate tasks" (Step 2). This step uses GitNexus to understand file dependencies so tasks can be properly scoped and ordered.

**Files:** `.claude/commands/primitiv.tasks.md`

**Acceptance Criteria:**
- [ ] New step references `gitnexus.impact` for blast radius per planned file change
- [ ] New step references `gitnexus.context` for understanding symbol coupling
- [ ] Manual fallback using Glob/Grep is included
- [ ] Existing task generation instructions are unchanged

---

## TASK-005: Enhance primitiv.implement.md GitNexus references

**Status:** pending

Expand the existing brief `gitnexus.context` reference (line 24) into a structured before/after pattern:

- **Before**: `context` to understand the file + `impact` to check blast radius
- **After**: `detect_changes` to verify all impacted files were addressed

**Files:** `.claude/commands/primitiv.implement.md`

**Acceptance Criteria:**
- [ ] References `gitnexus.context` and `gitnexus.impact` before code changes
- [ ] References `gitnexus.detect_changes` after implementation completes
- [ ] Manual fallback using Glob/Grep/git-diff is included
- [ ] Existing implementation instructions are unchanged

---

## TASK-006: Add GitNexus section to primitiv.test-feature.md

**Status:** pending

Insert a test boundary discovery step before test generation (before Step 2). Uses GitNexus to find existing tests, understand code paths, and ensure complete coverage.

**Files:** `.claude/commands/primitiv.test-feature.md`

**Acceptance Criteria:**
- [ ] New step references `gitnexus.query` for finding existing tests and related code
- [ ] New step references `gitnexus.context` for understanding integration boundaries
- [ ] New step references `gitnexus.impact` for complete test coverage of affected paths
- [ ] Manual fallback using Glob/Grep is included
- [ ] Existing test generation and execution instructions are unchanged

---

## TASK-007: Add GitNexus section to primitiv.compushpr.md

**Status:** pending

Add an impact analysis step before PR creation (between Step 4 "Push" and Step 5 "Create PR"). Uses `detect_changes` to generate an impact summary included in the PR body.

**Files:** `.claude/commands/primitiv.compushpr.md`

**Acceptance Criteria:**
- [ ] New step references `gitnexus.detect_changes` for impact analysis
- [ ] Manual fallback using `git diff --stat` is included
- [ ] PR body template includes an `## Impact Analysis` section
- [ ] Existing commit/push/merge instructions are unchanged
