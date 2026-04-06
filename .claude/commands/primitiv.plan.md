---
description: "Generate a technical implementation plan for a spec"
---

# Technical Plan (GitNexus-powered)

You are generating a **technical implementation plan** for a specification. You MUST search the existing codebase before planning.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect from the current git branch
- If provided, use that spec ID

## Instructions

### Step 1: Load Context

#### Governance Context (pre-flight)
1. Check if `.primitiv/governance-context.json` exists
   - **If YES**: Read it. This is the compiled GovernanceContext. Include the full JSON as a structured block in your working context:
     ```
     ## Governance Context
     { <full governance-context.json contents> }
     ```
     Use this as the authoritative source for all governance rules — do not re-read individual markdown files.
   - **If NO**: Warn: "`governance-context.json` not found — run `primitiv compile` for a consistent compiled context." Then fall back: read `.primitiv/gates/` and `.primitiv/constitutions/` markdown files directly.

2. Read the spec: `.primitiv/specs/SPEC-XXX-*/spec.md`
3. Read clarifications (if any): `.primitiv/specs/SPEC-XXX-*/clarifications.md`

### Step 2: Codebase Exploration (CRITICAL)
Before planning ANY new code, search the existing codebase:

1. **Use GitNexus MCP tools** (if available):
   - `gitnexus.query` — Search for existing implementations related to the spec
   - `gitnexus.context` — Get 360-degree analysis of relevant symbols/functions
   - `gitnexus.impact` — Assess blast radius of planned changes

2. **Fallback: Manual search** (if GitNexus not available):
   - Search for related files, functions, and patterns
   - Look for existing utilities, helpers, and shared code
   - Understand the project structure and conventions

3. **Document findings:**
   - What already exists that relates to this spec
   - Functions/modules to reuse (with file paths)
   - Established patterns to follow
   - What truly needs to be built from scratch

### Step 3: Generate Plan
Create the implementation plan:
1. **Approach**: High-level technical approach
2. **Codebase Analysis**: What exists, what to reuse, what patterns to follow
3. **File Changes**: List every file to create/modify/delete with descriptions. For each file change, reference the Gherkin Feature and Scenario names from the spec's acceptance criteria that the change satisfies (e.g., `"— Feature: User Registration > Scenario: Successful registration"`)
4. **Architecture**: How new code fits into the existing system
5. **Risks**: What could go wrong
6. **Dependencies**: External dependencies or blockers

### Step 4: Write Plan
Write to `.primitiv/specs/SPEC-XXX-*/plan.md` with frontmatter:
```yaml
type: plan
version: 1
specId: SPEC-XXX
approach: "<one-line summary>"
fileChanges:
  - path: "src/..."
    action: create|modify|delete
    description: "..."
risks: [<identified risks>]
dependencies: [<blockers>]
codebaseAnalysis:
  existingCode: [<what already exists>]
  reusableModules: [<what to reuse>]
  patternsToFollow: [<patterns>]
updatedAt: "<now ISO>"
```

### Step 5: Update Status
- Update spec status to `planned`
- Update `updatedAt`

## Output
- Summary of codebase analysis findings
- Overview of the technical approach
- List of file changes
- Risks and dependencies
- Suggest running `/primitiv.tasks` next
