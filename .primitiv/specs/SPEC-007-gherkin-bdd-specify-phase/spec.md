---
type: spec
id: SPEC-007
title: "Gherkin BDD Integration in Specify Phase"
status: completed
version: 6
branch: "spec/SPEC-007-gherkin-bdd-specify-phase"
author: "Dieu"
createdAt: "2026-04-06T12:00:00.000Z"
updatedAt: "2026-04-06T13:00:00.000Z"
---

# SPEC-007: Gherkin BDD Integration in Specify Phase

## Description

The Primitiv pipeline already uses a BDD-like pattern in specs — scenarios with "As a...I want to...so that..." phrasing and acceptance criteria as markdown checkboxes. However, these criteria are freeform text. There is no structured syntax that machines can parse, no formal link between a scenario step and a generated test, and no way to validate that every scenario is covered.

This spec introduces **Gherkin syntax** (Given/When/Then) as the structured language for writing acceptance criteria inside specs. Gherkin scenarios replace the current freeform checkbox lists in the `## Acceptance Criteria` section of every spec produced by `/primitiv.specify`.

The goal is threefold:

1. **Precision** — Gherkin forces each criterion into a testable step with preconditions (Given), actions (When), and observable outcomes (Then). Freeform checkboxes allow vague criteria that are hard to test.
2. **Traceability** — Each Gherkin scenario becomes a named, addressable unit that `/primitiv.test-feature` can map 1:1 to a test case. The test-results document can reference scenarios by name instead of paraphrasing checkbox text.
3. **Consistency** — A structured syntax means the AI agent generating the spec and the AI agent generating tests share an unambiguous contract. No interpretation drift between specify and test phases.

This is **not** about adopting Cucumber, a `.feature` file format, or a Gherkin parser library. It is about using Gherkin's Given/When/Then vocabulary as the structured language for acceptance criteria within Primitiv's existing markdown spec format.

## Current Behavior

### Spec Structure (`/primitiv.specify`)

The `/primitiv.specify` command (`.claude/commands/primitiv.specify.md`) generates specs with these sections:
- Description, Current Behavior, Proposed Changes, Acceptance Criteria (freeform checkboxes), Test Strategy, Constraints, Out of Scope

**Current acceptance criteria format** (from existing specs like SPEC-001):
```markdown
## Acceptance Criteria

### Scenario 1: Creating a New Specification

**As a** builder, **I want to** describe a feature in natural language
**so that** the system generates a structured specification.

- [ ] Builder provides a natural language feature description
- [ ] System generates a unique spec ID (SPEC-XXX format)
- [ ] System creates a dedicated directory for the spec
```

**Problems with current format:**
- Checkboxes are freeform text — no structure to distinguish preconditions from actions from outcomes
- No formal scenario naming convention — test mapping is done by human interpretation
- The "As a...I want to...so that..." block is disconnected from the checkboxes below it
- No step parameterization — similar scenarios require full duplication
- No way to programmatically validate that all criteria are testable

### Test Generation (`/primitiv.test-feature`)

The `/primitiv.test-feature` command reads acceptance criteria and generates Vitest test cases. Currently, the agent must interpret freeform checkbox text and decide what to test. The mapping from criterion to test is documented in `test-results.md` as a table, but the link is fragile — it's a human-readable description, not a structural reference.

### Relevant Source Files

| File | Role |
|------|------|
| `src/engine/SpecManager.ts` | Creates and manages spec documents |
| `src/schemas/spec.ts` | `SpecFrontmatterSchema` — validates spec YAML frontmatter |
| `src/schemas/task.ts` | `TaskItemSchema.acceptanceCriteria` — string array linking tasks to criteria |
| `src/schemas/testResults.ts` | `TestResultsFrontmatterSchema` — test summary schema |
| `.claude/commands/primitiv.specify.md` | Specify command template |
| `.claude/commands/primitiv.plan.md` | Plan command template |
| `.claude/commands/primitiv.tasks.md` | Tasks command template |
| `.claude/commands/primitiv.test-feature.md` | Test generation command template |
| `templates/commands/primitiv.specify.md` | Specify command source template |
| `templates/commands/primitiv.plan.md` | Plan command source template |
| `templates/commands/primitiv.tasks.md` | Tasks command source template |
| `templates/commands/primitiv.test-feature.md` | Test generation source template |

## Proposed Changes

### 1. Gherkin Acceptance Criteria Format

Replace freeform checkbox acceptance criteria with Gherkin scenarios inside the spec markdown:

```markdown
## Acceptance Criteria

### Feature: Creating a New Specification

#### Scenario: Generating a spec from natural language
  Given the user has an initialized Primitiv workspace
  And no spec exists for the described feature
  When the user runs `/primitiv.specify` with a feature description
  Then the system generates a unique spec ID in SPEC-XXX format
  And the system creates a dedicated directory at `.primitiv/specs/SPEC-XXX-<slug>/`
  And the spec contains Description, Acceptance Criteria, Constraints, and Out of Scope sections

#### Scenario: Spec with existing constitutions
  Given the user has product, development, and architecture constitutions
  When the user runs `/primitiv.specify` with a feature description
  Then the spec references the tech stack from the development constitution
  And gate checks validate against all three constitutions

### Feature: Gate Validation

#### Scenario: Spec fails security gate
  Given a spec that proposes storing passwords in plaintext
  When the system runs gate checks
  Then Gate 2 (Security Principles) fails with a violation report
  And the spec status remains "draft"
```

**Key rules:**
- **Mandatory** — All new specs must use Gherkin. No fallback to freeform checkboxes.
- **No minimum complexity** — A single Feature with one Scenario is valid for simple specs.
- Each `### Feature:` groups related scenarios under a capability, with a plain-English description paragraph (replaces the old "As a...I want to...so that..." user story format)
- Each `#### Scenario:` is a named, testable unit
- Steps use `Given` (precondition), `When` (action), `Then` (outcome), `And` (continuation), `But` (negative continuation)
- Steps are **indented plain text** (2-space indent under the Scenario heading) — no fenced code blocks, no blockquotes
- Steps are plain English — no regex patterns, no step definition files
- Scenario Outlines with `Examples:` tables are supported for parameterized scenarios
- Background sections are supported for shared preconditions within a Feature

### 2. Update `/primitiv.specify` Command

Modify the specify command template to instruct the AI agent to:
- **Mandatory Gherkin** — all acceptance criteria must use Feature/Scenario/Given/When/Then format
- Replace "As a...I want to...so that..." user story blocks with plain-English Feature descriptions
- Use `Scenario Outline` + `Examples` table when multiple similar cases exist
- Use `Background` for shared preconditions within a Feature group
- Render steps as 2-space indented plain text (no code fences, no blockquotes)
- Ensure every `Then` step describes an observable, testable outcome
- Name scenarios descriptively — the name becomes the test case identifier
- No minimum complexity — a single Feature with one Scenario is acceptable for simple features

### 3. Update `/primitiv.test-feature` Command

Modify the test-feature command template to:
- Parse Gherkin scenarios from the spec's `## Acceptance Criteria` section
- Generate **one `describe` block per Feature**, **one nested `describe` per Scenario**, and **one `it` block per Then/And step**
- `Given` + `When` steps run in `beforeEach` (arrange + act), each `Then`/`And` step is a separate `it()` (assert)
- For `Scenario Outline` with `Examples`: generate separate `it.each` blocks per Then step — each row x each Then step = an individual test
- Reference scenarios by name in `test-results.md` for traceability

### 4. Update `/primitiv.plan` Command

Modify the plan command template to reference Gherkin scenarios when mapping planned implementation steps to acceptance criteria:
- The plan's approach section references Feature/Scenario names when explaining which criteria each planned change satisfies
- File change descriptions reference the scenarios they implement

### 5. Update `/primitiv.tasks` Command

Modify the tasks command to reference Gherkin scenarios when breaking down implementation tasks:
- Each task's `acceptanceCriteria` array references scenario names instead of freeform text
- Tasks can reference specific scenarios: `"Feature: Gate Validation > Scenario: Spec fails security gate"`

### 6. Update Test Results Format

Enhance `test-results.md` to use scenario-based mapping:

```markdown
## Acceptance Criteria Coverage

| Feature | Scenario | Test File | Status |
|---------|----------|-----------|--------|
| Creating a New Specification | Generating a spec from natural language | specManager.test.ts | PASS |
| Creating a New Specification | Spec with existing constitutions | specManager.test.ts | PASS |
| Gate Validation | Spec fails security gate | gateValidation.test.ts | PASS |
```

### 7. Spec Schema Updates

No changes to `SpecFrontmatterSchema` in `src/schemas/spec.ts` — Gherkin lives in the markdown body, not the YAML frontmatter. The frontmatter remains metadata; the Gherkin scenarios are content.

Update `TaskItemSchema.acceptanceCriteria` in `src/schemas/task.ts` to document that values should reference Gherkin scenario names (documentation change, no schema breaking change).

## Acceptance Criteria

### Feature: Gherkin Syntax in Specs

#### Scenario: Specify command generates Gherkin acceptance criteria
  Given the user runs `/primitiv.specify` with a feature description
  When the AI agent generates the spec document
  Then the `## Acceptance Criteria` section contains Gherkin syntax
  And each criterion is grouped under a `### Feature:` heading
  And each test case is a `#### Scenario:` with Given/When/Then steps
  And every `Then` step describes an observable, testable outcome

#### Scenario: Scenario Outline for parameterized cases
  Given the feature has multiple similar test cases differing only in input/output
  When the AI agent generates the spec
  Then it uses `#### Scenario Outline:` with `<placeholder>` variables in steps
  And an `Examples:` table provides the parameter values

#### Scenario: Background for shared preconditions
  Given multiple scenarios within a Feature share the same Given steps
  When the AI agent generates the spec
  Then it uses a `Background:` block before the scenarios
  And individual scenarios omit the shared Given steps

### Feature: Test Generation from Gherkin

#### Scenario: Test file structure mirrors Gherkin structure
  Given a spec with Gherkin acceptance criteria
  When the user runs `/primitiv.test-feature`
  Then each `Feature` maps to a top-level `describe` block
  And each `Scenario` maps to a nested `describe` block
  And each `Then`/`And` step maps to an individual `it` block
  And the test names match the scenario and step text

#### Scenario: Given/When/Then maps to test phases
  Given a spec with a Gherkin scenario containing Given, When, and Then steps
  When the AI agent generates test code
  Then `Given` and `When` steps run in `beforeEach` (arrange + act)
  And each `Then`/`And` step is a separate `it()` block (assert)

#### Scenario: Scenario Outline generates parameterized tests
  Given a spec with a Scenario Outline and Examples table
  When the AI agent generates test code
  Then it generates a separate `it.each` block per Then step
  And each row in the Examples table becomes a test case per Then step

#### Scenario: Test results reference scenarios by name
  Given tests have been generated and executed
  When the test-results.md is written
  Then the acceptance criteria coverage table lists Feature and Scenario names
  And each scenario maps to a specific test file and pass/fail status

### Feature: Plan Integration

#### Scenario: Plan references Gherkin scenarios
  Given a spec with Gherkin acceptance criteria has passed gate checks
  When the user runs `/primitiv.plan`
  Then the plan's approach section references Feature and Scenario names
  And file change descriptions reference the scenarios they implement

### Feature: Task Integration

#### Scenario: Tasks reference Gherkin scenarios
  Given a spec with Gherkin acceptance criteria has been planned
  When the user runs `/primitiv.tasks`
  Then each task's `acceptanceCriteria` field references scenario names
  And the format is `"Feature: <name> > Scenario: <name>"`

### Feature: Backward Compatibility

#### Scenario: Existing specs with checkbox criteria remain valid
  Given an existing spec with freeform checkbox acceptance criteria
  When the user runs `/primitiv.test-feature` on that spec
  Then the test generation works as before
  And no errors are thrown due to missing Gherkin syntax

#### Scenario: Mixed format during transition
  Given a spec with some Gherkin scenarios and some freeform checkboxes
  When the user runs `/primitiv.test-feature`
  Then Gherkin scenarios generate structured tests
  And freeform checkboxes generate tests using the existing approach

## Test Strategy

- **Unit tests**: Validate that spec content generated by the updated `/primitiv.specify` template contains valid Gherkin syntax (Feature/Scenario/Given/When/Then structure)
- **Integration tests**: End-to-end flow from `/primitiv.specify` producing Gherkin criteria through `/primitiv.test-feature` generating correctly structured Vitest test files
- **Backward compatibility tests**: Ensure existing specs with checkbox-style criteria still work with `/primitiv.test-feature`

## Constraints

- **No Gherkin parser library**: This is Gherkin-as-vocabulary, not Gherkin-as-toolchain. The AI agent reads and writes Gherkin natively in markdown — no `@cucumber/gherkin` dependency.
- **No `.feature` files**: Gherkin lives inside `spec.md` under `## Acceptance Criteria`, not in separate files. The spec document remains the single source of truth.
- **No step definition files**: Steps are natural language interpreted by the AI agent, not regex-matched functions.
- **No Cucumber runtime**: Tests are generated as standard Vitest tests, not executed through a Cucumber runner.
- **Markdown-native**: Gherkin syntax must render cleanly in any markdown viewer. No custom syntax that breaks rendering.
- **Template-only changes for specify/test-feature**: The core source code changes are limited to schema documentation. The behavioral changes are in the command templates that instruct the AI agent.

## Out of Scope

- **Cucumber integration**: Running tests through a Cucumber/Gherkin parser at runtime
- **Step definition libraries**: Reusable step implementations shared across specs
- **`.feature` file export**: Generating standalone Gherkin files from specs
- **Gherkin linting/validation tooling**: Automated syntax checking of Gherkin in specs
- **Retroactive conversion**: Automatically converting existing specs' checkbox criteria to Gherkin
- **Internationalized Gherkin keywords**: Only English Given/When/Then keywords are supported
- **Tags and hooks**: Gherkin `@tag` annotations for filtering or pre/post hooks
