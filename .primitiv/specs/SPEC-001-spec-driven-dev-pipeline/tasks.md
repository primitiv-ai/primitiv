---
type: tasks
version: 1
specId: SPEC-001
tasks:
  - id: TASK-001
    title: "Add audit trail module (NDJSON)"
    description: "Create src/engine/AuditManager.ts that appends/reads NDJSON audit records to .primitiv/specs/SPEC-XXX-*/audit.log. Each record captures: timestamp, actor, action, specId, previousStatus, newStatus, details. Wire into PrimitivEngine facade."
    status: completed
    files:
      - "src/engine/AuditManager.ts"
      - "src/engine/PrimitivEngine.ts"
      - "src/schemas/audit.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "AuditRecordSchema validates all fields (timestamp, actor, action, specId, previousStatus, newStatus, details)"
      - "appendAuditRecord() appends a single JSON line to the spec's audit.log"
      - "readAuditLog() returns parsed AuditRecord[] from a spec's audit.log"
      - "Action codes defined: SPEC_CREATED, GATE_CHECK_PASSED, GATE_CHECK_WARNED, GATE_CHECK_FAILED, SPEC_CLARIFIED, SPEC_PLANNED, SPEC_TASKED, STATUS_CHANGED"
      - "AuditManager is wired into PrimitivEngine as engine.audit"
      - "Schema and manager exported from src/index.ts"
    dependsOn: []

  - id: TASK-002
    title: "Add research utilities module"
    description: "Create src/engine/ResearchManager.ts with helpers for the research phase: createResearchTemplate() generates a blank research.md skeleton, validateResearch() checks that all decisions have required fields (decision, rationale, alternativesConsidered), readResearch() parses an existing research.md."
    status: completed
    files:
      - "src/engine/ResearchManager.ts"
      - "src/engine/PrimitivEngine.ts"
      - "src/schemas/research.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "ResearchDecisionSchema validates: id (R-XXX), title, decision, rationale, alternativesConsidered (min 1), codebasePrecedent (nullable)"
      - "createResearchTemplate(specDir) writes a skeleton research.md with frontmatter"
      - "validateResearch(specDir) returns validation result: all decisions have required fields"
      - "readResearch(specDir) parses research.md and returns typed ResearchDecision[]"
      - "ResearchManager wired into PrimitivEngine as engine.research"
      - "Schema and manager exported from src/index.ts"
    dependsOn: []

  - id: TASK-003
    title: "Add contract utilities module"
    description: "Create src/engine/ContractManager.ts with helpers for OpenAPI contract files: writeContract() writes a YAML file to specs/SPEC-XXX-*/contracts/, readContract() reads and returns parsed YAML, listContracts() lists all contracts in a spec directory."
    status: completed
    files:
      - "src/engine/ContractManager.ts"
      - "src/engine/PrimitivEngine.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "writeContract(specDir, filename, content) writes YAML to contracts/ subdirectory"
      - "readContract(specDir, filename) reads and returns parsed contract content"
      - "listContracts(specDir) returns filenames of all .yaml files in contracts/"
      - "contracts/ directory is created automatically if missing"
      - "ContractManager wired into PrimitivEngine as engine.contracts"
      - "Manager exported from src/index.ts"
    dependsOn: []

  - id: TASK-004
    title: "Add task DAG cycle detection"
    description: "Extend task validation with cycle detection and topological ordering. Add validateTaskDependencies() that checks: all dependsOn references exist, no cycles in the dependency graph, returns topological wave ordering for parallel execution."
    status: completed
    files:
      - "src/validation/taskValidator.ts"
      - "src/validation/index.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "validateTaskDependencies(tasks) returns { valid, errors, waves } where waves is Task[][] (topological groups)"
      - "Detects and reports cycles with the cycle path"
      - "Detects references to non-existent task IDs"
      - "Tasks with dependsOn: [] land in wave 0"
      - "Exported from src/index.ts"
    dependsOn: []

  - id: TASK-005
    title: "Add --filter flag to status command"
    description: "Extend the status CLI command to accept --filter <status> which filters the spec table to only show specs matching the given status value."
    status: completed
    files:
      - "src/commands/status.ts"
      - "src/cli.ts"
    acceptanceCriteria:
      - "primitiv status --filter planned shows only specs with status 'planned'"
      - "Invalid filter values produce a clear error listing valid statuses"
      - "Without --filter, behavior is unchanged (show all)"
    dependsOn: []

  - id: TASK-006
    title: "Add --output flag to status command"
    description: "Extend the status CLI command to accept --output <path> which writes a markdown report file with the full pipeline status table, suitable for committing to the repo."
    status: completed
    files:
      - "src/commands/status.ts"
      - "src/cli.ts"
    acceptanceCriteria:
      - "primitiv status --output .primitiv/status.md writes a markdown file with a formatted status table"
      - "The markdown includes: generation timestamp, spec count, and a table with all spec fields"
      - "--output can be combined with --filter"
      - "Without --output, behavior is unchanged (stdout only)"
    dependsOn: []

  - id: TASK-007
    title: "Integrate audit trail into spec status transitions"
    description: "Hook the AuditManager into SpecManager so that every status transition automatically appends an audit record. Also audit spec creation."
    status: completed
    files:
      - "src/engine/SpecManager.ts"
      - "src/engine/PrimitivEngine.ts"
    acceptanceCriteria:
      - "SpecManager.create() appends a SPEC_CREATED audit record"
      - "SpecManager.updateStatus() appends a STATUS_CHANGED audit record with previousStatus and newStatus"
      - "Audit records include the git user as actor (or 'system' fallback)"
      - "Existing SpecManager tests still pass"
    dependsOn: ["TASK-001"]

  - id: TASK-008
    title: "Add default branch detection to git module"
    description: "Add detectDefaultBranch() to src/git/ that resolves the project's default branch with fallback chain: origin/HEAD → local main → local master → error."
    status: completed
    files:
      - "src/git/branching.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "detectDefaultBranch(cwd) returns 'main' or 'master' (or whatever the default is)"
      - "Tries origin/HEAD first, falls back to checking local branches"
      - "Throws GitNotFoundError with clear message if neither main nor master exists"
      - "Exported from src/index.ts"
    dependsOn: []

  - id: TASK-009
    title: "Tests for audit trail module"
    description: "Write unit tests for AuditManager and AuditRecordSchema covering: append, read, schema validation, action codes, roundtrip."
    status: completed
    files:
      - "tests/audit.test.ts"
    acceptanceCriteria:
      - "Schema tests: valid records parse, invalid records rejected, all action codes accepted"
      - "appendAuditRecord creates file if missing, appends if exists"
      - "readAuditLog returns empty array for missing file, parsed records for existing"
      - "NDJSON format: each line is valid JSON, no trailing comma"
      - "All tests pass with npm test"
    dependsOn: ["TASK-001"]

  - id: TASK-010
    title: "Tests for research, contracts, task DAG, and git modules"
    description: "Write unit tests for ResearchManager, ContractManager, taskValidator, and detectDefaultBranch."
    status: completed
    files:
      - "tests/research.test.ts"
      - "tests/contracts.test.ts"
      - "tests/taskValidator.test.ts"
      - "tests/git.test.ts"
    acceptanceCriteria:
      - "Research: schema validation, template creation, research parsing, validation of incomplete decisions"
      - "Contracts: write/read roundtrip, list contracts, auto-create directory"
      - "Task DAG: cycle detection, missing deps detection, topological wave ordering, independent tasks in wave 0"
      - "Git: default branch detection with main, master, and no-remote scenarios"
      - "All tests pass with npm test"
    dependsOn: ["TASK-002", "TASK-003", "TASK-004", "TASK-008"]
updatedAt: "2026-03-15T12:00:00.000Z"
---

# Task Breakdown: SPEC-001 — Spec-Driven Development Pipeline

> **Note**: The plan assumed a greenfield Next.js project, but this repo is an existing npm package (primitiv-spec-engine v0.2.0) with working schemas, managers, CLI, state machine, gate validators, git operations, and frontmatter utilities. These tasks cover only what's **genuinely missing** relative to the spec requirements.

## TASK-001: Add audit trail module (NDJSON)

**Status**: pending | **Depends on**: none

Create `src/engine/AuditManager.ts` and `src/schemas/audit.ts` implementing FR-007 (Audit Trail). Each spec gets an `audit.log` file with append-only NDJSON records tracking every pipeline event.

**Files**: `src/engine/AuditManager.ts`, `src/schemas/audit.ts`, `src/engine/PrimitivEngine.ts`, `src/index.ts`

---

## TASK-002: Add research utilities module

**Status**: pending | **Depends on**: none

Create `src/engine/ResearchManager.ts` and `src/schemas/research.ts` implementing FR-004 (Research Phase) utilities. Provides skeleton generation, parsing, and validation for research.md documents.

**Files**: `src/engine/ResearchManager.ts`, `src/schemas/research.ts`, `src/engine/PrimitivEngine.ts`, `src/index.ts`

---

## TASK-003: Add contract utilities module

**Status**: pending | **Depends on**: none

Create `src/engine/ContractManager.ts` implementing FR-005 (Design Artifacts) for OpenAPI contract file management in the `contracts/` subdirectory of each spec.

**Files**: `src/engine/ContractManager.ts`, `src/engine/PrimitivEngine.ts`, `src/index.ts`

---

## TASK-004: Add task DAG cycle detection

**Status**: pending | **Depends on**: none

Create `src/validation/taskValidator.ts` that validates task dependency graphs: checks for cycles, dangling references, and computes topological wave ordering for parallel execution.

**Files**: `src/validation/taskValidator.ts`, `src/validation/index.ts`, `src/index.ts`

---

## TASK-005: Add --filter flag to status command

**Status**: pending | **Depends on**: none

Extend `primitiv status` with `--filter <status>` to show only specs matching a given pipeline status.

**Files**: `src/commands/status.ts`, `src/cli.ts`

---

## TASK-006: Add --output flag to status command

**Status**: pending | **Depends on**: none

Extend `primitiv status` with `--output <path>` to write a markdown report file with the pipeline status table.

**Files**: `src/commands/status.ts`, `src/cli.ts`

---

## TASK-007: Integrate audit trail into spec status transitions

**Status**: pending | **Depends on**: TASK-001

Hook AuditManager into SpecManager so that spec creation and every status transition automatically appends an audit record.

**Files**: `src/engine/SpecManager.ts`, `src/engine/PrimitivEngine.ts`

---

## TASK-008: Add default branch detection to git module

**Status**: pending | **Depends on**: none

Add `detectDefaultBranch()` with fallback chain (origin/HEAD → main → master → error) to support FR-008 (branch creation always from default branch).

**Files**: `src/git/branching.ts`, `src/index.ts`

---

## TASK-009: Tests for audit trail module

**Status**: pending | **Depends on**: TASK-001

Unit tests for AuditManager, AuditRecordSchema, NDJSON format, append/read operations.

**Files**: `tests/audit.test.ts`

---

## TASK-010: Tests for research, contracts, task DAG, and git modules

**Status**: pending | **Depends on**: TASK-002, TASK-003, TASK-004, TASK-008

Unit tests for all new modules: ResearchManager, ContractManager, taskValidator, detectDefaultBranch.

**Files**: `tests/research.test.ts`, `tests/contracts.test.ts`, `tests/taskValidator.test.ts`, `tests/git.test.ts`
