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

2. **Map acceptance criteria to test structure:**

   Read the spec's `## Acceptance Criteria` section and determine the format:

   **If the spec uses Gherkin BDD format** (has `### Feature:` and `#### Scenario:` headings with Given/When/Then steps):

   Map Gherkin structure directly to test structure:
   - Each `### Feature:` → top-level `describe("<Feature name>", () => { ... })` block
   - Each `#### Scenario:` → nested `describe("<Scenario name>", () => { ... })` block
   - `Given` + `When` steps → `beforeEach(() => { ... })` inside the Scenario describe (arrange + act)
   - Each `Then` / `And` (after Then) step → separate `it("<step text>", () => { ... })` block (assert)
   - `Background:` steps → `beforeEach` in the Feature-level describe, before all Scenario describes
   - `Scenario Outline:` + `Examples:` table → separate `it.each()` block per Then step. Each row in the Examples table becomes a test case for each Then step.

   **Example mapping:**
   ```typescript
   describe("User Registration", () => {
     describe("Successful registration with valid data", () => {
       let result: RegistrationResult;
       beforeEach(() => {
         // Given the user is on the registration page
         // And no account exists for "test@example.com"
         // When the user submits the form with valid data
         result = register({ name: "Test", email: "test@example.com", password: "secure123" });
       });
       it("a new user account is created", () => {
         expect(result.user).toBeDefined();
       });
       it("a confirmation email is sent", () => {
         expect(mockEmail.send).toHaveBeenCalledWith("test@example.com");
       });
     });

     describe("Registration rejects invalid input", () => {
       it.each([
         ["not-an-email", "Invalid email format"],
         ["", "Email is required"],
       ])("the form displays an error for email=%s", (value, error) => {
         const result = register({ email: value });
         expect(result.error).toBe(error);
       });
     });
   });
   ```

   **If the spec uses checkbox format** (legacy — specs created before SPEC-007):
   - Fall back to the existing approach: each checkbox criterion maps to at least one test assertion
   - No structural mapping required — use flat `describe`/`it` blocks as before

3. **Determine test types needed:**
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

4. **Generate test files:**
   - Follow the project's existing test conventions (directory structure, naming, imports)
   - Apply the Gherkin-to-test mapping from step 2 (or checkbox mapping for legacy specs)
   - Place tests in the project's test directory (not in `.primitiv/`)
   - Name test files clearly: `<feature>.test.ts`, `<feature>.spec.ts`, etc.

5. **Run tests:**
   - For unit/integration/API tests: run the project's test command (from dev constitution or package.json)
   - For UI tests: execute the Chrome DevTools MCP sequence (navigate → interact → assert via screenshots and evaluate_script)
   - Capture results: total, passed, failed, skipped

6. **Write test results:**
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
   - **For Gherkin specs**, include a scenario-based coverage table:
     ```markdown
     ## Acceptance Criteria Coverage

     | Feature | Scenario | Then Step | Test File | Status |
     |---------|----------|-----------|-----------|--------|
     | User Registration | Successful registration | a new user account is created | registration.test.ts | PASS |
     | User Registration | Successful registration | a confirmation email is sent | registration.test.ts | PASS |
     ```

7. **Update spec status:**
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
