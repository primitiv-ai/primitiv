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
   - Read the spec: `.primitiv/specs/SPEC-XXX-*/spec.md`
   - Read the plan: `.primitiv/specs/SPEC-XXX-*/plan.md` (required — run `/primitiv.plan` first if missing)
   - Read clarifications if any

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

4. **Write tasks:**
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
   updatedAt: "<now ISO>"
   ```
   Also write each task as a markdown section in the body for readability.

5. **Update status:**
   - Update spec status to `tasked`
   - Update `updatedAt`

## Output
- List all tasks with their IDs and titles
- Show the total number of tasks
- Suggest running `/primitiv.implement` next
