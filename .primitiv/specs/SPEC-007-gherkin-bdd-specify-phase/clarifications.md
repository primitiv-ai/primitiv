---
type: clarifications
specId: SPEC-007
version: 1
updatedAt: "2026-04-06T12:15:00.000Z"
---

# Clarifications — SPEC-007

## Q: Should Gherkin be mandatory for all new specs going forward, or optional?
**A:** Mandatory — all new specs produced by `/primitiv.specify` must use Gherkin format. No more checkbox criteria for new specs.
**Impact:** The specify command template must enforce Gherkin, not offer it as an option. No fallback to checkboxes.

## Q: Should the 'As a...I want to...so that...' user story blocks be preserved?
**A:** Replace with Feature descriptions — drop the "As a..." format. Each `### Feature:` gets a plain-English description paragraph instead.
**Impact:** The specify template instructions must explicitly replace the user story format with Feature-level descriptions.

## Q: How should Gherkin steps render in the markdown spec?
**A:** Indented plain text — steps are indented 2 spaces under the Scenario heading. No fenced code blocks or blockquotes.
**Impact:** The specify template must instruct the agent to use 2-space indented plain text for steps, not code fences.

## Q: Should `/primitiv.test-feature` treat each Scenario as one test, or split each Then step into its own test?
**A:** One test per Then step — each Then/And assertion becomes its own `it()` block. Given+When run in `beforeEach`. Scenarios become nested `describe()` blocks.
**Impact:** Major change to the test generation template. Tests are more granular: `describe(Feature) > describe(Scenario) > it(Then step)`. Requires `beforeEach` for Given/When setup.

## Q: Is the `/primitiv.tasks` command update in scope?
**A:** Yes — update `/primitiv.tasks` to reference Gherkin scenarios as `"Feature: X > Scenario: Y"`.
**Impact:** The tasks template must be updated alongside specify and test-feature.

## Q: Should `/primitiv.plan` also be updated to reference Gherkin scenarios?
**A:** Yes — update `/primitiv.plan` to reference Feature/Scenario names when mapping implementation approach to acceptance criteria.
**Impact:** The plan template must be updated. Expands scope to 4 command templates: specify, plan, tasks, test-feature.

## Q: For Scenario Outline with Examples, how granular should test generation be?
**A:** Row x Then = separate tests — each Examples row combined with each Then step produces an individual `it()` / `it.each()` block. Maximum granularity.
**Impact:** The test-feature template must instruct separate `it.each` blocks per Then step, not one combined block per Scenario Outline.

## Q: Is there a minimum complexity for Gherkin in simple specs?
**A:** No minimum — 1 Feature with 1 Scenario is acceptable. Gherkin is mandatory, not verbose.
**Impact:** The specify template should not force artificial scenario counts. Simple features get simple Gherkin.
