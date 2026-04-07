---
description: "Create a new spec from a feature description"
---

# Create Specification

You are creating a new **feature specification** in the Spec Driven Development pipeline.

## Input

The user's feature description: `$ARGUMENTS`

## Instructions

1. **Read existing context:**
   - Read `.primitiv/gates/company-principles.md` (if exists)
   - Read `.primitiv/gates/security-principles.md` (if exists)
   - Read `.primitiv/constitutions/product.md` (if exists)
   - Read `.primitiv/constitutions/development.md` (if exists)
   - Read `.primitiv/constitutions/architecture.md` (if exists)
   - Read `.primitiv/.state.json` to get the next spec ID

   **Relevant Learnings:**
   - Read all `.primitiv/learnings/*.md` files (if the directory exists)
   - Extract keywords from the current spec's title and description
   - Match learning tags against these keywords (case-insensitive)
   - If relevant learnings are found, display them in a "Relevant Learnings" section:
     ```
     Relevant Learnings:
       ⚠ LEARN-001 (important): Always validate env vars at startup [validation, configuration]
       ℹ LEARN-003 (info): Use semantic HTML for accessibility [ui, accessibility]
     ```
   - Use ⚠ for important/critical severity, ℹ for info

2. **Explore existing codebase (GitNexus-powered):**
   Before writing the spec, understand what already exists so the spec is grounded in reality.

   **Use GitNexus MCP tools** (if available):
   - `gitnexus_query({query: "<feature keywords>"})` — Find existing execution flows, entry points, and related code. This tells you what the codebase already has vs what needs to be built.
   - `gitnexus_context({name: "<key symbol>"})` — For symbols discovered in the query, get callers/callees to understand integration points and existing patterns.
   - `READ gitnexus://repo/{name}/clusters` — Review functional areas to understand where the new feature fits in the architecture.

   **Fallback** (if GitNexus not indexed):
   - Use Grep/Glob to search for related files and patterns
   - Read key source files to understand existing implementations

   **Document in the spec:**
   - Add a "Current Behavior" section describing what already exists
   - Reference specific files/functions that will be modified
   - Note established patterns the implementation should follow

3. **Generate spec ID:**
   - Read `.primitiv/.state.json`, get `nextSpecId`, format as `SPEC-XXX` (zero-padded to 3 digits)
   - Increment `nextSpecId` in `.state.json` and save

4. **Create git branch:**
   - Create branch: `spec/SPEC-XXX-<slug>` (slug from title, lowercase, hyphens, max 50 chars)
   - Checkout the new branch

5. **Generate the spec document:**
   - Parse the natural language description
   - Create structured spec with YAML frontmatter:
     ```yaml
     type: spec
     id: SPEC-XXX
     title: "<concise title>"
     status: draft
     version: 1
     branch: "spec/SPEC-XXX-<slug>"
     author: "<git user>"
     createdAt: "<now ISO>"
     updatedAt: "<now ISO>"
     ```
   - Write rich content with these sections:
     - **Description** — What the feature does and why
     - **Current Behavior** — What already exists (from codebase exploration)
     - **Proposed Changes** — What will change
     - **Acceptance Criteria** — **Mandatory Gherkin BDD format** (see below)
     - **Test Strategy** — Which test types apply
     - **Constraints** — Limitations and boundaries
     - **Out of Scope** — What is explicitly excluded

   **Acceptance Criteria format (mandatory Gherkin BDD):**

   All acceptance criteria MUST use Gherkin syntax. No freeform checkboxes.

   - Group criteria under `### Feature: <capability name>` headings
   - Add a plain-English description paragraph under each Feature (do NOT use "As a...I want to...so that..." user stories)
   - Write each test case as `#### Scenario: <descriptive name>` — the name becomes the test identifier
   - Write steps as 2-space indented plain text under the Scenario heading:
     - `Given` — precondition (arrange)
     - `When` — action (act)
     - `Then` — observable outcome (assert)
     - `And` / `But` — continuation of the previous step type
   - Every `Then` step MUST describe an observable, testable outcome
   - Use `#### Scenario Outline:` with `<placeholder>` variables + `Examples:` table for parameterized cases
   - Use `Background:` before scenarios when multiple scenarios in a Feature share the same `Given` steps
   - No minimum complexity — 1 Feature with 1 Scenario is valid for simple specs

   **Example:**
   ```markdown
   ## Acceptance Criteria

   ### Feature: User Registration

   Handles new user account creation with validation and confirmation.

   #### Scenario: Successful registration with valid data
     Given the user is on the registration page
     And no account exists for "test@example.com"
     When the user submits the form with valid name, email, and password
     Then a new user account is created
     And a confirmation email is sent to "test@example.com"
     And the user is redirected to the dashboard

   #### Scenario Outline: Registration rejects invalid input
     Given the user is on the registration page
     When the user submits the form with <field> set to <value>
     Then the form displays an error: <error>

     Examples:
     | field    | value          | error                  |
     | email    | not-an-email   | Invalid email format   |
     | password | short          | Minimum 8 characters   |
     | name     |                | Name is required       |

   ### Feature: Email Confirmation

   #### Background:
     Given a user has registered with "test@example.com"
     And a confirmation email has been sent

   #### Scenario: Valid confirmation link
     When the user clicks the confirmation link within 24 hours
     Then the account status changes to "confirmed"

   #### Scenario: Expired confirmation link
     When the user clicks the confirmation link after 24 hours
     Then the system shows "Link expired" and offers to resend
   ```

   - Write to `.primitiv/specs/SPEC-XXX-<slug>/spec.md`

6. **Run gate checks:**
   - **Gate 1 (Company Principles):** Check if the spec aligns with company priorities and boundaries. If company principles exist, verify alignment. Report any violations.
   - **Gate 2 (Security Principles):** Check if the spec respects security policies. Flag any security concerns.
   - **Gate 3 (Constitutions):** Check product fit, dev stack compatibility, architecture alignment.
   - For each gate that passes, update the spec status: `draft → gate-1-passed → gate-2-passed → gate-3-passed`
   - If a gate has no principles/constitution defined yet, warn but don't block.

7. **Report results:**
   - Show the spec ID and branch name
   - Show gate check results (pass/warn/fail for each)
   - Suggest next steps: `/primitiv.clarify` or `/primitiv.plan`

## Output Format
```
✓ Created spec SPEC-XXX: <title>
  Branch: spec/SPEC-XXX-<slug>

Gate Checks:
  ✓ Gate 1 (Company Principles): Passed
  ✓ Gate 2 (Security Principles): Passed
  ⚠ Gate 3 (Constitutions): Product constitution not found — generate with /primitiv.constitution product

Next steps:
  /primitiv.clarify     — Resolve assumptions with Q&A
  /primitiv.plan        — Generate technical implementation plan
```
