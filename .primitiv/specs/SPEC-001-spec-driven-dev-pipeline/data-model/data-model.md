# Data Model: Spec-Driven Development Pipeline

**Feature**: SPEC-001
**Date**: 2026-03-15

> All entities are file-based for SPEC-001 (CLI-first). Prisma models will be defined in a future spec when the web UI is built.

---

## Entity: PipelineState

**Storage**: `.primitiv/.state.json`

| Field | Type | Description |
|-------|------|-------------|
| nextSpecId | number | Next available spec ID (auto-incrementing) |
| nextFeatureId | number | Next available feature ID |
| projectRoot | string | Absolute path to project root |
| mode | string | Project mode: `"greenfield"` or `"existing"` |
| initializedAt | string (ISO 8601) | Timestamp of pipeline initialization |

**Constraints**:
- `nextSpecId` must be >= 1
- `nextSpecId` increments atomically on each spec creation
- File is read/written synchronously (single-builder assumption)

---

## Entity: Spec

**Storage**: `.primitiv/specs/SPEC-XXX-<slug>/spec.md` (YAML frontmatter)

| Field | Type | Description |
|-------|------|-------------|
| type | string | Always `"spec"` |
| id | string | Unique ID: `SPEC-XXX` (zero-padded, min 3 digits) |
| title | string | Concise feature title |
| status | SpecStatus | Current pipeline status |
| version | number | Increments on each update |
| branch | string | Git branch: `spec/SPEC-XXX-<slug>` |
| author | string | Git user name at creation time |
| createdAt | string (ISO 8601) | Creation timestamp |
| updatedAt | string (ISO 8601) | Last update timestamp |

**State Transitions** (SpecStatus):
```
draft
  → gate-1-passed
    → gate-2-passed
      → gate-3-passed
        → clarified
          → planned
            → ready
              → in-progress
                → testing
                  → review
                    → deployed
                      → archived

deprecated (reachable from any status except archived)
```

**Constraints**:
- `id` is globally unique and sequential
- `status` can only move forward (no backward transitions except to `deprecated`)
- `version` starts at 1 and increments monotonically
- `branch` follows the pattern `spec/SPEC-XXX-<slug>`

**Directory Structure**:
```
.primitiv/specs/SPEC-XXX-<slug>/
  spec.md           # Spec document with frontmatter
  clarifications.md # Q&A clarifications (optional)
  research.md       # AI research findings (generated during plan)
  audit.log         # NDJSON audit trail
  contracts/        # OpenAPI contract files
    api.yaml        # OpenAPI 3.1 spec (if applicable)
  data-model/       # Data model documentation
    data-model.md   # Entity definitions
  checklists/       # Quality checklists
    requirements.md # Spec quality validation
```

---

## Entity: GateCheckResult

**Storage**: In-memory during gate check execution; results written to audit.log

| Field | Type | Description |
|-------|------|-------------|
| gate | string | Gate identifier: `"gate-1"`, `"gate-2"`, `"gate-3"` |
| gateName | string | Human-readable: `"Company Principles"`, etc. |
| status | `"pass"` \| `"warn"` \| `"fail"` | Check result |
| details | string[] | Specific findings (violations or confirmations) |
| timestamp | string (ISO 8601) | When the check was performed |

**Constraints**:
- `status: "fail"` blocks spec progression (strict block, no override)
- `status: "warn"` is produced when a gate document is missing
- `details` must contain at least one entry explaining the result

---

## Entity: ResearchDecision

**Storage**: `.primitiv/specs/SPEC-XXX-<slug>/research.md` (structured markdown)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Decision ID: `R-XXX` (sequential within the research doc) |
| title | string | Decision topic |
| decision | string | What was chosen |
| rationale | string | Why it was chosen |
| alternativesConsidered | string[] | Other options evaluated with rejection reasons |
| codebasePrecedent | string \| null | Existing pattern in the codebase (if any) |

**Constraints**:
- Every research decision must have at least one alternative considered
- `rationale` must explain the "why", not just restate the decision

---

## Entity: Task

**Storage**: `.primitiv/specs/SPEC-XXX-<slug>/tasks.md` (structured markdown)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Task ID: `T-XXX` (sequential within the task list) |
| title | string | Task title |
| description | string | What needs to be done |
| scope | `"small"` \| `"medium"` \| `"large"` | Estimated effort |
| dependsOn | string[] | Task IDs that must complete first |
| acceptanceCriteria | string[] | Testable conditions for completion |
| status | `"pending"` \| `"in-progress"` \| `"completed"` | Current task status |

**Constraints**:
- Dependencies form a DAG (no cycles)
- Tasks without dependencies can be executed in parallel
- TDD ordering: test tasks precede or are bundled with implementation tasks

---

## Entity: AuditRecord

**Storage**: `.primitiv/specs/SPEC-XXX-<slug>/audit.log` (NDJSON — one JSON object per line)

| Field | Type | Description |
|-------|------|-------------|
| timestamp | string (ISO 8601) | When the event occurred |
| actor | string | Git user name or `"system"` |
| action | string | Action code (see below) |
| specId | string | Spec ID: `SPEC-XXX` |
| previousStatus | string \| null | Status before transition (null for creation) |
| newStatus | string | Status after transition |
| details | object \| null | Additional context (gate results, etc.) |

**Action Codes**:
- `SPEC_CREATED` — New spec created
- `GATE_CHECK_PASSED` — Gate check passed
- `GATE_CHECK_WARNED` — Gate check produced warning
- `GATE_CHECK_FAILED` — Gate check failed (blocks progression)
- `SPEC_CLARIFIED` — Clarification applied
- `SPEC_PLANNED` — Plan generated
- `SPEC_TASKED` — Tasks generated
- `STATUS_CHANGED` — Generic status transition

**Constraints**:
- Append-only — records are never modified or deleted
- Each record is a single line of valid JSON
- Timestamps use server-local time in ISO 8601 format
