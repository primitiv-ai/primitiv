---
description: "Break down a plan into actionable implementation tasks"
---

# Task Breakdown

You are breaking down a **technical plan** into small, actionable implementation tasks.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect from the current git branch
- If provided, use that spec ID

## Instructions

1. **Load context:**

   #### Governance Context (pre-flight)
   1. Check if `.primitiv/governance-context.json` exists
      - **If YES**: Read it. Include the full JSON as a structured block in your working context:
        ```
        ## Governance Context
        { <full governance-context.json contents> }
        ```
        Use this as the authoritative source for all governance rules — do not re-read individual markdown files.
      - **If NO**: Warn: "`governance-context.json` not found — run `primitiv compile` for a consistent compiled context." Then fall back: read `.primitiv/gates/` and `.primitiv/constitutions/` markdown files directly.

   2. Read the spec: `.primitiv/specs/SPEC-XXX-*/spec.md`
   3. Read the plan: `.primitiv/specs/SPEC-XXX-*/plan.md` (required — run `/primitiv.plan` first if missing)
   4. Read clarifications if any

2. **Generate tasks:**
   - Each task must be **small** (implementable in a single focused session)
   - Each task must be **independently verifiable** (has clear acceptance criteria)
   - Each task must reference **specific files** to create or modify
   - Order tasks by dependency (foundational tasks first)
   - Group related tasks logically

3. **Task format:**
   For each task, define:
   - `id`: TASK-001, TASK-002, etc.
   - `title`: Clear, actionable title
   - `description`: What to implement
   - `status`: `pending`
   - `files`: List of files to create/modify
   - `acceptanceCriteria`: List of checkable criteria
   - `dependsOn`: List of task IDs this task depends on (e.g., `["TASK-001"]`). Use `[]` for tasks with no dependencies.

4. **Dependency rules:**
   - A task that creates a base type/model used by others → other tasks `dependsOn` it
   - A task that extends or integrates another task's output → `dependsOn` that task
   - Tasks that touch completely separate files with no shared interfaces → `dependsOn: []` (can run in parallel)
   - Avoid unnecessary dependencies — maximize parallelism by only adding dependencies where there is a real data or interface dependency
   - Every task ID referenced in `dependsOn` must exist in the task list

5. **Write tasks:**
   Write to `.primitiv/specs/SPEC-XXX-*/tasks.md` with frontmatter:
   ```yaml
   type: tasks
   version: 1
   specId: SPEC-XXX
   tasks:
     - id: TASK-001
       title: "..."
       description: "..."
       status: pending
       files: ["src/...", "tests/..."]
       acceptanceCriteria:
         - "..."
       dependsOn: []
     - id: TASK-002
       title: "..."
       description: "..."
       status: pending
       files: ["src/other/..."]
       acceptanceCriteria:
         - "..."
       dependsOn: ["TASK-001"]
   updatedAt: "<now ISO>"
   ```
   Also write each task as a markdown section in the body for readability.

6. **Update status:**
   - Update spec status to `tasked`
   - Update `updatedAt`

## Output
- List all tasks with their IDs, titles, and dependencies
- Show the total number of tasks
- Show the parallelism structure: which tasks can run in parallel (same wave) vs. which must wait
- Suggest running `/primitiv.implement` next
