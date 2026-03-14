---
description: "Execute implementation tasks for the current spec"
---

# Implement Tasks

You are executing the **implementation tasks** for a specification, using **parallel execution** when possible.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect from the current git branch
- If provided, use that spec ID

## Instructions

### Phase 1 — Load context

1. Read the spec, plan, tasks, and clarifications
2. Read all gates and constitutions for reference
3. Collect all `pending` tasks

### Phase 2 — Build dependency graph and compute waves

Using the `dependsOn` field on each task, compute execution **waves** (topological sort into parallel groups):

- **Wave 0**: All tasks with `dependsOn: []` (no dependencies) — these run first, in parallel
- **Wave 1**: Tasks whose dependencies are ALL in Wave 0
- **Wave N**: Tasks whose dependencies are ALL in Waves 0 through N-1

**File overlap safety check:** Within each wave, check if any two tasks share files in their `files` array. If they do, move one of the conflicting tasks to the next wave to prevent merge conflicts.

If any task has a `dependsOn` referencing a non-existent or `skipped` task, mark it as `skipped` with reason "dependency unavailable".

### Phase 3 — Execute waves

For each wave, in order:

#### A) Single-task wave (1 task)

Execute the task directly in the current working tree (no worktree overhead):

1. Read the task details (description, files, acceptance criteria)
2. If GitNexus is available, use `gitnexus.context` to understand files before modifying them
3. Implement the code changes following dev and architecture constitutions
4. Verify acceptance criteria are met
5. Update the task status to `completed` in tasks.md
6. Commit with message: `task(SPEC-XXX): TASK-YYY - <title>`

#### B) Multi-task wave (2+ tasks)

Spawn **parallel subagents**, each in an isolated git worktree:

1. For each task in the wave, launch a subagent using the Agent tool with:
   - `isolation: "worktree"` — gives each subagent its own branch + working copy
   - `run_in_background: false` — wait for all to complete
   - A focused prompt containing:
     - The task ID, title, description, files, and acceptance criteria
     - The spec ID and relevant context (constitutions, architecture patterns)
     - A summary of what was implemented in prior waves (so the subagent understands the current state)
     - Instruction to commit with message: `task(SPEC-XXX): TASK-YYY - <title>`

   **Launch ALL subagents for the wave in a SINGLE message** (multiple Agent tool calls in one response) so they run concurrently.

2. When all subagents complete, merge each worktree branch back to the current branch:
   ```
   git merge <worktree-branch> --no-edit
   ```

3. **If a merge conflict occurs:**
   - First attempt: resolve the conflict manually by examining both sides and making the correct merge
   - If the conflict is too complex: abort the merge (`git merge --abort`), then re-implement that task directly in the current working tree (sequential fallback)

4. After all merges succeed, update each task's status to `completed` in tasks.md

#### C) Move to the next wave

Repeat Phase 3 for each subsequent wave until all waves are done.

### Phase 4 — Finalize

1. Update spec status to `in-progress`
2. Report a summary:
   - Number of waves executed
   - Tasks completed per wave (and which ran in parallel)
   - Any conflicts resolved or tasks skipped
3. Suggest running `/primitiv.test-feature` next

## Subagent prompt template

When spawning a worker subagent for a task, use this structure:

```
You are implementing a single task for spec {SPEC_ID}.

## Task
- ID: {task.id}
- Title: {task.title}
- Description: {task.description}
- Files: {task.files}
- Acceptance criteria:
{task.acceptanceCriteria, each as a bullet}

## Project context
- Dev constitution: {summary of dev conventions, stack, testing requirements}
- Architecture: {summary of architecture patterns}
- Prior completed tasks: {list of task IDs + titles from previous waves}

## Instructions
1. Implement the changes described above
2. Follow conventions from the dev constitution
3. Respect architecture patterns
4. Write tests if required by the dev constitution
5. Do NOT break existing functionality
6. Commit your changes with message: "task({SPEC_ID}): {task.id} - {task.title}"
```

## Edge cases

- **No `dependsOn` fields on tasks (legacy tasks):** Fall back to sequential execution (treat each task as depending on the previous one)
- **All tasks in one wave:** All are independent — launch all in parallel
- **Single task total:** Execute directly, no orchestration overhead
- **Circular dependencies:** If detected, report an error and fall back to sequential execution

## Output
- For each wave: show which tasks ran (parallel or sequential) and what was implemented
- Final summary: total tasks completed/skipped, waves executed, parallelism achieved
- Suggest next step: `/primitiv.test-feature` to generate and run tests
