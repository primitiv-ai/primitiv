---
description: "Execute implementation tasks for the current spec"
---

# Implement Tasks

You are executing the **implementation tasks** for a specification.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect from the current git branch
- If provided, use that spec ID

## Instructions

1. **Load context:**
   - Read the spec, plan, tasks, and clarifications
   - Read all gates and constitutions for reference
   - Identify the next `pending` task

2. **For each pending task:**
   a. Read the task details (description, files, acceptance criteria)
   b. If GitNexus is available, use `gitnexus.context` to understand files before modifying them
   c. Implement the code changes:
      - Create new files as specified
      - Modify existing files carefully
      - Follow the development constitution's conventions
      - Respect the architecture constitution's patterns
   d. Verify acceptance criteria are met
   e. Update the task status to `completed` in tasks.md
   f. Move to the next task

3. **During implementation:**
   - Follow existing code patterns and conventions
   - Write tests if the dev constitution requires them
   - Don't break existing functionality
   - If a task is blocked, mark it as `skipped` with a reason and move on

4. **When all tasks are done:**
   - Update spec status to `in-progress` (when starting first task)
   - Update spec status to `completed` (when all tasks done)
   - Summarize what was implemented

## Output
- For each task: show what was implemented and files changed
- Final summary: total tasks completed/skipped
- Remind that the branch is ready for review/merge
