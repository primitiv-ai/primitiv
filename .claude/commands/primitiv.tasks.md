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

2. **Analyze file dependencies for task scoping:**

   Use GitNexus MCP tools (if available):
   - `gitnexus.impact` — For each file change listed in the plan, assess blast radius to identify tightly-coupled files that must be grouped into the same task
   - `gitnexus.context` — Get 360-degree view of key symbols to understand which files share dependencies and should be modified together

   Fallback (if GitNexus not indexed):
   - Use Glob/Grep to find imports and references between planned files
   - Read key files to understand coupling

   Use these findings to: group tightly-coupled files into the same task, order tasks by dependency depth, and list all affected files per task.

3. **Generate tasks:**
   - Each task must be **small** (implementable in a single focused session)
   - Each task must be **independently verifiable** (has clear acceptance criteria)
   - Each task must reference **specific files** to create or modify
   - Order tasks by dependency (foundational tasks first)
   - Group related tasks logically

4. **Task format:**
   For each task, define:
   - `id`: TASK-001, TASK-002, etc.
   - `title`: Clear, actionable title
   - `description`: What to implement
   - `status`: `pending`
   - `files`: List of files to create/modify
   - `acceptanceCriteria`: List of Gherkin scenario references from the spec, using the format `"Feature: <name> > Scenario: <name>"` (e.g., `"Feature: User Registration > Scenario: Successful registration"`). For legacy specs with checkbox criteria, use the checkbox text verbatim.

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
         - "Feature: User Auth > Scenario: Login with valid credentials"
   updatedAt: "<now ISO>"
   ```
   Also write each task as a markdown section in the body for readability.

6. **Update status:**
   - Update spec status to `tasked`
   - Update `updatedAt`

## Output
- List all tasks with their IDs and titles
- Show the total number of tasks
- Suggest running `/primitiv.implement` next
