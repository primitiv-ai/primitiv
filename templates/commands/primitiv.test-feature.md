---
description: "Generate and run tests for the current spec based on acceptance criteria"
---

# Test Feature

You are generating and running **tests** for a specification based on its acceptance criteria.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect from the current git branch
- If provided, use that spec ID

## Instructions

1. **Load context:**
   - Read the spec (acceptance criteria = test requirements), plan, tasks
   - Read `.primitiv/constitutions/development.md` for test framework/conventions
   - Read `.primitiv/constitutions/architecture.md` for system boundaries
   - Identify the spec's `## Test Strategy` section for guidance

2. **Determine test types needed:**
   Based on the spec's acceptance criteria and test strategy, determine which test types apply:

   - **Unit tests** — For pure logic, utilities, transformations. Use the test framework specified in the dev constitution (e.g., Vitest, Jest, pytest).
   - **Integration tests** — For multi-component interactions, database operations, service communication.
   - **API tests** — For HTTP endpoints, request/response validation, status codes, error handling. Use TDD approach: write tests from acceptance criteria, then verify they pass against the implementation.
   - **UI tests** — For user-facing interactions. Use Chrome DevTools MCP tools:
     - `navigate_page` — Navigate to the page under test
     - `take_screenshot` — Capture visual state
     - `click` — Interact with elements
     - `fill` — Fill form fields
     - `evaluate_script` — Assert DOM state, check values, verify behavior
     - `wait_for` — Wait for elements or network requests

3. **Generate test files:**
   - Follow the project's existing test conventions (directory structure, naming, imports)
   - Each acceptance criterion should map to at least one test assertion
   - Place tests in the project's test directory (not in `.primitiv/`)
   - Name test files clearly: `<feature>.test.ts`, `<feature>.spec.ts`, etc.

4. **Run tests:**
   - For unit/integration/API tests: run the project's test command (from dev constitution or package.json)
   - For UI tests: execute the Chrome DevTools MCP sequence (navigate → interact → assert via screenshots and evaluate_script)
   - Capture results: total, passed, failed, skipped

5. **Write test results:**
   - Write results to `.primitiv/specs/SPEC-XXX-*/test-results.md` with frontmatter:
     ```yaml
     type: test-results
     specId: SPEC-XXX
     version: 1
     testTypes: [unit, integration]  # whichever types were run
     summary:
       total: N
       passed: N
       failed: N
       skipped: N
     updatedAt: "<now ISO>"
     ```
   - Include test details in the content body

6. **Update spec status:**
   - If all tests pass: update spec status to `tested`
   - If any tests fail: keep status as `in-progress`, report failures

## Output Format
```
Testing SPEC-XXX: <title>

Test Types: unit, integration, api
  ✓ Unit:        12/12 passed
  ✓ Integration:  4/4 passed
  ✗ API:          3/5 passed (2 failed)

Failed Tests:
  - api/auth.test.ts: POST /login returns 401 for invalid credentials
  - api/auth.test.ts: Rate limiting after 5 failed attempts

Overall: 19/21 passed, 2 failed

Status: in-progress (fix failures and re-run)
```
