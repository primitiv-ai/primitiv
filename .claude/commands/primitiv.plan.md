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
- Read the spec: `.primitiv/specs/SPEC-XXX-*/spec.md`
- Read clarifications (if any): `.primitiv/specs/SPEC-XXX-*/clarifications.md`
- Read all gates and constitutions
- Read the development constitution for stack/conventions
- Read the architecture constitution for patterns/boundaries

### Step 2: Codebase Exploration (CRITICAL)
Before planning ANY new code, search the existing codebase:

1. **Use GitNexus MCP tools** (if available):
   - `gitnexus.query` — Search for existing implementations related to the spec (e.g., query with feature keywords to find relevant execution flows and entry points)
   - `gitnexus.context` — For each key symbol/function discovered, get a 360-degree view: callers, callees, type info, and process participation. Use this to understand what to reuse and what patterns are established.
   - `gitnexus.impact` — For each file or symbol you plan to change, assess blast radius: what depends on it, what could break, and what must be considered in the plan
   - `gitnexus://repo/{name}/clusters` resource — Review functional clusters to understand how the codebase is organized into logical areas

2. **Fallback: Manual search** (if GitNexus not indexed):
   - Use Glob to find related files by name patterns
   - Use Grep to search for function/class references and imports
   - Read key files to understand existing utilities, helpers, and shared code
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
