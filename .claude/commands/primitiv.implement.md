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
   b. **Before modifying files** — understand context and blast radius:

      Use GitNexus MCP tools (if available):
      - `gitnexus.context` — For each file/symbol you will modify, get 360-degree view: callers, callees, type info, and process participation. Understand what depends on the code you're changing.
      - `gitnexus.impact` — Assess blast radius of the planned change to identify downstream effects and files that may need coordinated updates.

      Fallback (if GitNexus not indexed):
      - Use Glob/Grep to find imports and references to the code being modified
      - Read dependent files to understand potential side effects

   c. Implement the code changes:
      - Create new files as specified
      - Modify existing files carefully
      - Follow the development constitution's conventions
      - Respect the architecture constitution's patterns
   d. Verify acceptance criteria are met
   e. Update the task status to `completed` in tasks.md
   f. Move to the next task

3. **After all tasks are complete — verify impact:**

   Use GitNexus MCP tools (if available):
   - `gitnexus.detect_changes` — Analyze the git diff to map all affected processes, symbols, and downstream dependencies. Verify no unintended side effects remain unaddressed.

   Fallback (if GitNexus not indexed):
   - Run `git diff --stat` to review all changed files
   - Manually verify that related files were not missed

4. **During implementation:**
   - Follow existing code patterns and conventions
   - Write tests if the dev constitution requires them
   - Don't break existing functionality
   - If a task is blocked, mark it as `skipped` with a reason and move on

5. **When all tasks are done:**
   - Update spec status to `in-progress` (when starting first task)
   - Update spec status to `completed` (when all tasks done)
   - Summarize what was implemented

6. **Update architecture log:**
   - Append a tech stack entry to `constitutions/architecture.md` (create the file if it doesn't exist)
   - Format: `- <stack, DB changes, new dependencies> (SPEC-XXX)`
   - If no database or infrastructure changes: `- N/A (no infrastructure changes) (SPEC-XXX)`
   - This keeps the architecture constitution as a running log of what each spec introduced from a tech stack perspective

## Output
- For each task: show what was implemented and files changed
- Final summary: total tasks completed/skipped
- Remind that the branch is ready for review/merge
