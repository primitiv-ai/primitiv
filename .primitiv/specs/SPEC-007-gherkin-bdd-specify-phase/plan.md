---
type: plan
version: 1
specId: SPEC-007
approach: "Update 4 command templates (specify, plan, tasks, test-feature) in both .claude/commands/ and templates/commands/ to use Gherkin BDD syntax for acceptance criteria, plus a JSDoc update on TaskItemSchema.acceptanceCriteria"
fileChanges:
  - path: ".claude/commands/primitiv.specify.md"
    action: modify
    description: "Replace checkbox instruction with mandatory Gherkin format (Feature/Scenario/Given/When/Then), plain-English Feature descriptions instead of user stories, 2-space indented steps — Feature: Gherkin Syntax in Specs"
  - path: "templates/commands/primitiv.specify.md"
    action: modify
    description: "Same changes as .claude/commands/ counterpart — source template for specify"
  - path: ".claude/commands/primitiv.plan.md"
    action: modify
    description: "Add instruction to reference Feature/Scenario names when mapping planned changes to acceptance criteria — Feature: Plan Integration"
  - path: "templates/commands/primitiv.plan.md"
    action: modify
    description: "Same changes as .claude/commands/ counterpart — source template for plan"
  - path: ".claude/commands/primitiv.tasks.md"
    action: modify
    description: "Update acceptanceCriteria field instructions to reference Gherkin scenario names as 'Feature: X > Scenario: Y' — Feature: Task Integration"
  - path: "templates/commands/primitiv.tasks.md"
    action: modify
    description: "Same changes as .claude/commands/ counterpart — source template for tasks"
  - path: ".claude/commands/primitiv.test-feature.md"
    action: modify
    description: "Replace test mapping instructions with Gherkin-aware structure: describe(Feature) > describe(Scenario) > beforeEach(Given+When) > it(Then); it.each for Scenario Outlines; scenario-based test-results table — Feature: Test Generation from Gherkin"
  - path: "templates/commands/primitiv.test-feature.md"
    action: modify
    description: "Same changes as .claude/commands/ counterpart — source template for test-feature"
  - path: "src/schemas/task.ts"
    action: modify
    description: "Add JSDoc comment on acceptanceCriteria field documenting Gherkin scenario reference format — Feature: Task Integration"
risks:
  - "Template divergence: .claude/commands/ and templates/commands/ are already slightly out of sync (GitNexus additions, governance pre-flight). Must update each pair independently, not blindly copy."
  - "Backward compatibility: existing specs (SPEC-001 through SPEC-006) use checkbox format. The test-feature template must handle both formats gracefully."
  - "Agent compliance: the AI agent's adherence to Gherkin format depends on template quality — poorly worded instructions will produce inconsistent output."
dependencies: []
codebaseAnalysis:
  existingCode:
    - ".claude/commands/primitiv.specify.md — active specify command with GitNexus exploration step (Step 2) and 'Acceptance Criteria (checkboxes)' instruction at Step 5"
    - ".claude/commands/primitiv.test-feature.md — active test command with GitNexus discovery step (Step 2), 'Each acceptance criterion should map to at least one test assertion' at Step 4"
    - ".claude/commands/primitiv.plan.md — active plan command, references spec/clarifications but does not explicitly reference acceptance criteria"
    - ".claude/commands/primitiv.tasks.md — active tasks command, has acceptanceCriteria in task format but no guidance on value format"
    - "templates/commands/ — source templates, slightly behind .claude/commands/ (missing GitNexus and governance pre-flight additions from SPEC-002, SPEC-005, SPEC-006)"
    - "src/schemas/task.ts — TaskItemSchema.acceptanceCriteria is z.array(z.string()).default([]) with no JSDoc"
  reusableModules:
    - "No new modules needed — all changes are template and documentation updates"
  patternsToFollow:
    - "Command templates use numbered steps with bold headings and nested bullets"
    - "YAML frontmatter examples use code fences with language tag"
    - "Output format sections use fenced code blocks showing expected CLI output"
    - "Both .claude/commands/ and templates/commands/ must be updated in tandem"
updatedAt: "2026-04-06T12:30:00.000Z"
---

# Plan — SPEC-007: Gherkin BDD Integration in Specify Phase

## Approach

Update the 4 core pipeline command templates (specify, plan, tasks, test-feature) to use Gherkin BDD syntax as the mandatory structured language for acceptance criteria. Each template is modified in both `.claude/commands/` (active) and `templates/commands/` (source). One schema file gets a JSDoc comment. No runtime code changes — this is entirely a template and documentation update.

## Codebase Analysis

### What Already Exists

The pipeline commands already have a BDD-like structure:
- `/primitiv.specify` instructs the agent to write "Acceptance Criteria (checkboxes)" in Step 5
- `/primitiv.test-feature` says "Each acceptance criterion should map to at least one test assertion" in Step 4
- `/primitiv.tasks` includes `acceptanceCriteria` in the task format but gives no guidance on what values look like
- `/primitiv.plan` references the spec but doesn't link planned changes to specific criteria

### Template Divergence

The `.claude/commands/` versions are ahead of `templates/commands/` for some files:
- `primitiv.plan.md` — `.claude/` has Step 1 with raw file reads; `templates/` has governance pre-flight
- `primitiv.tasks.md` — `.claude/` has GitNexus dependency analysis; `templates/` has governance pre-flight
- `primitiv.test-feature.md` — `.claude/` has GitNexus test discovery; `templates/` does not
- `primitiv.specify.md` — in sync

**Strategy:** Modify each file independently, applying the Gherkin changes to the existing content of each file without resolving unrelated divergences.

### What to Reuse

- All existing template structure (step numbering, formatting, YAML examples, output format)
- All existing GitNexus integration steps (unchanged)
- All existing governance pre-flight logic (unchanged)

### What to Build

No new files. All changes are insertions/modifications within existing templates.

## Detailed File Changes

### 1. `/primitiv.specify` — Gherkin Acceptance Criteria Format

**Both:** `.claude/commands/primitiv.specify.md` and `templates/commands/primitiv.specify.md`

**Change in Step 5 (Generate the spec document):**

Replace:
```
- Write rich content: Description, Current Behavior, Proposed Changes, Acceptance Criteria (checkboxes), Test Strategy, Constraints, Out of Scope
```

With instructions to write acceptance criteria in mandatory Gherkin format:
- `## Acceptance Criteria` uses `### Feature:` groupings with plain-English description paragraphs
- Each `#### Scenario:` is a named test case with Given/When/Then steps
- Steps are 2-space indented plain text
- `Scenario Outline:` with `Examples:` table for parameterized cases
- `Background:` for shared preconditions within a Feature
- Every `Then` step must describe an observable, testable outcome
- No minimum complexity — 1 Feature + 1 Scenario is valid

Include a concrete example in the template showing the expected format.

### 2. `/primitiv.plan` — Scenario References in Plan

**Both:** `.claude/commands/primitiv.plan.md` and `templates/commands/primitiv.plan.md`

**Change in Step 3 (Generate Plan):**

Add a bullet to the existing plan generation instructions:
- When mapping file changes to acceptance criteria, reference Gherkin Feature and Scenario names
- File change descriptions should note which scenarios they implement

### 3. `/primitiv.tasks` — Scenario References in Tasks

**Both:** `.claude/commands/primitiv.tasks.md` and `templates/commands/primitiv.tasks.md`

**Change in Task Format section:**

Update the `acceptanceCriteria` field description:
- Values reference Gherkin scenario names from the spec
- Format: `"Feature: <name> > Scenario: <name>"`
- Include example in the YAML template

### 4. `/primitiv.test-feature` — Gherkin-Driven Test Generation

**Both:** `.claude/commands/primitiv.test-feature.md` and `templates/commands/primitiv.test-feature.md`

**Major change in Step 3/4 (Generate test files):**

Add a new section between context loading and test generation explaining the Gherkin-to-test mapping:

- **If spec has Gherkin criteria:** Use structured mapping:
  - Each `### Feature:` → top-level `describe()` block
  - Each `#### Scenario:` → nested `describe()` block
  - `Given` + `When` steps → `beforeEach()` (arrange + act)
  - Each `Then`/`And` step → separate `it()` block (assert)
  - `Scenario Outline` + `Examples` → `it.each()` per Then step, each row = a test case
- **If spec has checkbox criteria (backward compat):** Use existing approach — each checkbox maps to at least one test assertion

**Change in Step 5/6 (Write test results):**

Update the test results content format to include a scenario-based coverage table:
```markdown
## Acceptance Criteria Coverage

| Feature | Scenario | Then Step | Test File | Status |
|---------|----------|-----------|-----------|--------|
```

### 5. `src/schemas/task.ts` — JSDoc Comment

Add a JSDoc comment above the `acceptanceCriteria` field:
```typescript
/** References Gherkin scenario names from the spec. Format: "Feature: X > Scenario: Y" */
acceptanceCriteria: z.array(z.string()).default([]),
```

## Architecture

No architectural changes. All modifications are to AI agent instruction templates. The runtime codebase (SpecManager, state machine, schemas, etc.) is untouched except for a single JSDoc comment.

The change propagates through the pipeline by modifying the instructions the AI agent follows at each phase:
```
/primitiv.specify  → writes Gherkin acceptance criteria in spec.md
/primitiv.plan     → references Feature/Scenario names in plan.md
/primitiv.tasks    → acceptanceCriteria field references scenarios in tasks.md
/primitiv.test-feature → generates describe/it blocks from Gherkin in test files
```

## Risks

1. **Template divergence** — `.claude/commands/` and `templates/commands/` are already slightly out of sync. Each file must be modified independently to avoid losing existing GitNexus or governance additions. Mitigation: read each file's current content before editing; do not copy between them.

2. **Backward compatibility** — Existing specs (SPEC-001 through SPEC-006) use checkbox format. The test-feature template must explicitly handle both. Mitigation: add a conditional instruction ("if spec has Gherkin... else if checkboxes...").

3. **Agent compliance** — Gherkin format depends on clear template instructions. Vague instructions produce inconsistent output. Mitigation: include a concrete Gherkin example in the specify template.

## Dependencies

None. No external packages, no blocked-on work, no infrastructure changes.
