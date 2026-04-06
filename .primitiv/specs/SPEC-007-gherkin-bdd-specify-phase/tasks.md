---
type: tasks
version: 1
specId: SPEC-007
tasks:
  - id: TASK-001
    title: "Update specify templates with mandatory Gherkin acceptance criteria format"
    description: "Replace the freeform checkbox instruction in Step 5 of /primitiv.specify with mandatory Gherkin BDD syntax. Add a concrete example showing Feature/Scenario/Given/When/Then format, Scenario Outline with Examples, and Background. Both .claude/commands/ and templates/commands/ versions."
    status: completed
    files:
      - ".claude/commands/primitiv.specify.md"
      - "templates/commands/primitiv.specify.md"
    acceptanceCriteria:
      - "Feature: Gherkin Syntax in Specs > Scenario: Specify command generates Gherkin acceptance criteria"
      - "Feature: Gherkin Syntax in Specs > Scenario: Scenario Outline for parameterized cases"
      - "Feature: Gherkin Syntax in Specs > Scenario: Background for shared preconditions"
    dependsOn: []
  - id: TASK-002
    title: "Update test-feature templates with Gherkin-to-test mapping and backward compatibility"
    description: "Add Gherkin-aware test generation instructions: describe(Feature) > describe(Scenario) > beforeEach(Given+When) > it(Then). Add it.each for Scenario Outlines. Add backward compatibility fallback for checkbox-format specs. Update test-results format with scenario-based coverage table. Both .claude/commands/ and templates/commands/ versions."
    status: completed
    files:
      - ".claude/commands/primitiv.test-feature.md"
      - "templates/commands/primitiv.test-feature.md"
    acceptanceCriteria:
      - "Feature: Test Generation from Gherkin > Scenario: Test file structure mirrors Gherkin structure"
      - "Feature: Test Generation from Gherkin > Scenario: Given/When/Then maps to test phases"
      - "Feature: Test Generation from Gherkin > Scenario: Scenario Outline generates parameterized tests"
      - "Feature: Test Generation from Gherkin > Scenario: Test results reference scenarios by name"
      - "Feature: Backward Compatibility > Scenario: Existing specs with checkbox criteria remain valid"
      - "Feature: Backward Compatibility > Scenario: Mixed format during transition"
    dependsOn: ["TASK-001"]
  - id: TASK-003
    title: "Update plan templates with Gherkin scenario references"
    description: "Add instruction to Step 3 (Generate Plan) to reference Feature/Scenario names when mapping file changes to acceptance criteria. Both .claude/commands/ and templates/commands/ versions."
    status: completed
    files:
      - ".claude/commands/primitiv.plan.md"
      - "templates/commands/primitiv.plan.md"
    acceptanceCriteria:
      - "Feature: Plan Integration > Scenario: Plan references Gherkin scenarios"
    dependsOn: ["TASK-001"]
  - id: TASK-004
    title: "Update tasks templates with scenario reference format and add JSDoc to schema"
    description: "Update acceptanceCriteria field description in task format to use 'Feature: X > Scenario: Y' reference format. Add JSDoc comment on TaskItemSchema.acceptanceCriteria in src/schemas/task.ts. Both .claude/commands/ and templates/commands/ versions for the template."
    status: completed
    files:
      - ".claude/commands/primitiv.tasks.md"
      - "templates/commands/primitiv.tasks.md"
      - "src/schemas/task.ts"
    acceptanceCriteria:
      - "Feature: Task Integration > Scenario: Tasks reference Gherkin scenarios"
    dependsOn: ["TASK-001"]
updatedAt: "2026-04-06T12:45:00.000Z"
---

# Tasks — SPEC-007: Gherkin BDD Integration in Specify Phase

## TASK-001: Update specify templates with mandatory Gherkin acceptance criteria format

**Status:** pending
**Files:** `.claude/commands/primitiv.specify.md`, `templates/commands/primitiv.specify.md`
**Depends on:** none

Replace the freeform checkbox instruction in Step 5 of `/primitiv.specify` with mandatory Gherkin BDD syntax. The key change is replacing:

```
- Write rich content: Description, Current Behavior, Proposed Changes, Acceptance Criteria (checkboxes), Test Strategy, Constraints, Out of Scope
```

With detailed instructions for:
- Mandatory Gherkin format — `### Feature:` with plain-English description, `#### Scenario:` with Given/When/Then steps
- 2-space indented plain text for steps (no code fences, no blockquotes)
- `Scenario Outline:` with `Examples:` table for parameterized cases
- `Background:` for shared preconditions
- Every `Then` must describe an observable, testable outcome
- No minimum complexity — 1 Feature + 1 Scenario is valid

Include a concrete Gherkin example in the template.

**Acceptance Criteria:**
- Feature: Gherkin Syntax in Specs > Scenario: Specify command generates Gherkin acceptance criteria
- Feature: Gherkin Syntax in Specs > Scenario: Scenario Outline for parameterized cases
- Feature: Gherkin Syntax in Specs > Scenario: Background for shared preconditions

---

## TASK-002: Update test-feature templates with Gherkin-to-test mapping and backward compatibility

**Status:** pending
**Files:** `.claude/commands/primitiv.test-feature.md`, `templates/commands/primitiv.test-feature.md`
**Depends on:** TASK-001

Add a new step (between context loading and test type determination) explaining Gherkin-to-test mapping:

**If spec has Gherkin criteria:**
- `### Feature:` → top-level `describe()` block
- `#### Scenario:` → nested `describe()` block
- `Given` + `When` steps → `beforeEach()` (arrange + act)
- Each `Then`/`And` step → separate `it()` block (assert)
- `Scenario Outline` + `Examples` → separate `it.each()` per Then step, each row = a test case

**If spec has checkbox criteria (backward compat):**
- Fall back to existing approach — each checkbox maps to at least one test assertion

Update test-results format to include scenario-based coverage table:
```
| Feature | Scenario | Then Step | Test File | Status |
```

**Acceptance Criteria:**
- Feature: Test Generation from Gherkin > Scenario: Test file structure mirrors Gherkin structure
- Feature: Test Generation from Gherkin > Scenario: Given/When/Then maps to test phases
- Feature: Test Generation from Gherkin > Scenario: Scenario Outline generates parameterized tests
- Feature: Test Generation from Gherkin > Scenario: Test results reference scenarios by name
- Feature: Backward Compatibility > Scenario: Existing specs with checkbox criteria remain valid
- Feature: Backward Compatibility > Scenario: Mixed format during transition

---

## TASK-003: Update plan templates with Gherkin scenario references

**Status:** pending
**Files:** `.claude/commands/primitiv.plan.md`, `templates/commands/primitiv.plan.md`
**Depends on:** TASK-001

Add a bullet to Step 3 (Generate Plan) in both template versions:
- When mapping file changes to acceptance criteria, reference Gherkin Feature and Scenario names
- File change descriptions should note which scenarios they satisfy

**Acceptance Criteria:**
- Feature: Plan Integration > Scenario: Plan references Gherkin scenarios

---

## TASK-004: Update tasks templates with scenario reference format and add JSDoc to schema

**Status:** pending
**Files:** `.claude/commands/primitiv.tasks.md`, `templates/commands/primitiv.tasks.md`, `src/schemas/task.ts`
**Depends on:** TASK-001

Update the task format section in both template versions:
- `acceptanceCriteria` values should reference Gherkin scenario names: `"Feature: X > Scenario: Y"`
- Update the YAML example to show the new format

Add JSDoc comment on `TaskItemSchema.acceptanceCriteria`:
```typescript
/** References Gherkin scenario names from the spec. Format: "Feature: X > Scenario: Y" */
acceptanceCriteria: z.array(z.string()).default([]),
```

**Acceptance Criteria:**
- Feature: Task Integration > Scenario: Tasks reference Gherkin scenarios
