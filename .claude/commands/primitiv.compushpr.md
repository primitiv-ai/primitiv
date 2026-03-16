---
description: "Commit, push, create PR, and squash merge for the current spec"
---

# Commit, Push & PR

You are finalizing a spec by committing all changes, pushing, creating a pull request, and squash merging.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect from the current git branch (`spec/SPEC-XXX-slug`)
- If provided, use that spec ID

## Instructions

1. **Detect spec:**
   - Get current branch name
   - Extract spec ID from branch pattern `spec/SPEC-XXX-*`
   - Read the spec, plan, tasks, and test results for context

2. **Generate CHANGELOG entry:**
   - Read `CHANGELOG.md` in the project root (create if missing)
   - Follow [Keep a Changelog](https://keepachangelog.com/) format
   - Add entry under `## [Unreleased]` with appropriate category (Added, Changed, Fixed, etc.)
   - Entry should summarize what the spec delivered (from spec title + description)

3. **Stage and commit:**
   - Run `git add -A` to stage all changes
   - Commit with conventional commit format: `feat(SPEC-XXX): <spec title>`
   - Use `fix(SPEC-XXX):` if the spec is a bug fix (detect from spec title/description)

4. **Push:**
   - Run `git push -u origin <branch-name>`

5. **Impact analysis for PR description:**

   Use GitNexus MCP tools (if available):
   - `gitnexus.detect_changes` — Analyze the git diff to map all affected processes, symbols, and downstream dependencies. Summarize which functional areas of the codebase were impacted.

   Fallback (if GitNexus not indexed):
   - Use `git diff --stat` for a file-level change summary

6. **Create PR:**
   - Use `gh pr create` with:
     - **Title:** Spec title (e.g., "Add user authentication")
     - **Body:** Summary format (NO checklist):
       ```
       ## Summary
       <1-3 sentences from spec description>

       **Spec:** SPEC-XXX
       **Branch:** spec/SPEC-XXX-slug

       ## Changes
       <bullet list of key changes from plan/tasks>

       ## Impact Analysis
       <affected functional areas and downstream dependencies from GitNexus detect_changes, or git diff --stat summary>

       ## Test Results
       <summary from test-results.md if available>
       ```
   - Do NOT include a review checklist — keep the PR clean

7. **Squash merge:**
   - Run `gh pr merge --squash --delete-branch`
   - This merges to main and deletes the feature branch

8. **Update spec status:**
   - Update spec status to `completed`

9. **Report results:**
   - Show commit hash, PR URL, merge confirmation

## Output Format
```
✓ Changelog updated
✓ Committed: feat(SPEC-001): Add user authentication
✓ Pushed to origin/spec/SPEC-001-add-user-auth
✓ PR created: #42 — Add user authentication
✓ Squash merged to main
✓ Branch spec/SPEC-001-add-user-auth deleted
✓ Spec SPEC-001 status → completed

PR: https://github.com/org/repo/pull/42
```
