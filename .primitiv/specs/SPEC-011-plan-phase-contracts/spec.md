---
type: spec
id: SPEC-011
title: "Contract Generation in Plan Phase"
status: completed
version: 1
branch: "spec/SPEC-011-plan-phase-contracts"
author: "Dieu"
createdAt: "2026-04-08T12:00:00Z"
updatedAt: "2026-04-08T12:00:00Z"
---

# SPEC-011: Contract Generation in Plan Phase

## Description

Integrate contract generation into the `/primitiv.plan` phase. When a plan is generated, it must also produce a `contracts/` folder inside the spec directory containing:

- **`api-contract.md`** — Generated when the feature introduces or modifies API endpoints (REST routes, Server Actions, webhook handlers, etc.)
- **`data-contract.md`** — Generated when the feature introduces or modifies database schema, models, or data structures

Both contracts are generated automatically based on the spec and plan analysis. Once generated, **contracts are the truth** — they are not guidelines or suggestions. During implementation, every API shape, field name, request/response type, and data model MUST match the contracts exactly. Any deviation from a contract is a defect, same as deviating from the spec itself.

## Current Behavior

- A `ContractManager` already exists at `src/engine/ContractManager.ts` with `writeContract()`, `readContract()`, and `listContracts()` methods
- `ContractManager` is already wired into `PrimitivEngine` as `engine.contracts`
- The `listContracts()` method currently only lists `.yaml`/`.yml` files — it does not support `.md` files
- The `/primitiv.plan` command template (`.claude/commands/primitiv.plan.md`) does not mention contracts at all
- No Zod schema exists for contract documents
- The contracts directory is already at the correct path: `.primitiv/specs/SPEC-XXX-*/contracts/`
- Tests exist in `tests/contracts.test.ts` but only cover YAML contract operations

## Proposed Changes

1. **Update `ContractManager.listContracts()`** to also support `.md` files (not just `.yaml`/`.yml`)
2. **Create a Zod schema** for contract frontmatter (`src/schemas/contract.ts`) defining the structure of api-contract and data-contract documents
3. **Update the `/primitiv.plan` command template** to include a new step that generates contracts:
   - Analyze the spec and plan to determine which contracts apply
   - Generate `api-contract.md` if the feature touches API surfaces
   - Generate `data-contract.md` if the feature touches database/data models
   - Skip contract generation if neither applies (pure refactor, template-only changes, etc.)
4. **Update the `/primitiv.implement` command template** to inject contracts as context:
   - In Phase 1 (Load context), read all contracts from `.primitiv/specs/SPEC-XXX-*/contracts/`
   - Include the full contract contents in the subagent prompt template so every implementing agent has the exact API shapes and data models to follow
   - For single-task execution (no subagent), load contracts into working context before implementing
5. **Update the plan frontmatter schema** (`src/schemas/plan.ts`) to include a `contracts` field listing which contracts were generated
6. **Export the new schema** from `src/index.ts`
7. **Update tests** to cover markdown contract support

### Contract Document Structure

#### api-contract.md

```markdown
---
type: contract
contractType: api
specId: SPEC-XXX
version: 1
updatedAt: "<ISO>"
---

# API Contract — <Feature Title>

## Endpoints

### <METHOD> <path>

**Description:** ...

**Request:**
- Headers: ...
- Body:
  ```typescript
  { field: type }
  ```

**Response (success):**
  ```typescript
  { success: true, data: { ... } }
  ```

**Response (error):**
  ```typescript
  { success: false, error: { code: string, message: string } }
  ```

**Validation:** Zod schema reference or inline definition

## Server Actions

### <actionName>

**Input:**
  ```typescript
  { field: type }
  ```

**Output:**
  ```typescript
  Result<{ ... }>
  ```
```

#### data-contract.md

```markdown
---
type: contract
contractType: data
specId: SPEC-XXX
version: 1
updatedAt: "<ISO>"
---

# Data Contract — <Feature Title>

## Models

### <ModelName>

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id    | String | @id @default(cuid()) | Primary key |
| ...   | ...  | ...         | ...         |

**Relations:**
- belongsTo: ...
- hasMany: ...

**Indexes:**
- ...

## Migrations

Summary of schema changes required.
```

## Acceptance Criteria

### Feature: Contract Generation During Plan Phase

The plan command automatically generates contract documents based on the spec's scope.

#### Background:
  Given a Primitiv project is initialized
  And a spec exists with status `gate-3-passed` or `clarified`

#### Scenario: API contract generated for feature with API changes
  Given the spec describes a feature that introduces new API endpoints or Server Actions
  When the user runs `/primitiv.plan`
  Then an `api-contract.md` file is created in `.primitiv/specs/SPEC-XXX-*/contracts/`
  And the contract contains endpoint definitions with request/response shapes
  And the plan frontmatter includes `contracts: ["api-contract.md"]`

#### Scenario: Data contract generated for feature with database changes
  Given the spec describes a feature that modifies the database schema or data models
  When the user runs `/primitiv.plan`
  Then a `data-contract.md` file is created in `.primitiv/specs/SPEC-XXX-*/contracts/`
  And the contract contains model definitions with fields, types, and relations
  And the plan frontmatter includes `contracts: ["data-contract.md"]`

#### Scenario: Both contracts generated when applicable
  Given the spec describes a feature that adds API endpoints and database models
  When the user runs `/primitiv.plan`
  Then both `api-contract.md` and `data-contract.md` are created in `contracts/`
  And the plan frontmatter includes `contracts: ["api-contract.md", "data-contract.md"]`

#### Scenario: No contracts generated for non-interface changes
  Given the spec describes a pure refactor or template-only change
  When the user runs `/primitiv.plan`
  Then no `contracts/` directory is created
  And the plan frontmatter includes `contracts: []`

### Feature: Contract Injection During Implementation

Contracts are injected as mandatory context into every implementing agent so that API shapes and data models are followed exactly.

#### Scenario: Contracts loaded during implement phase context loading
  Given a spec has contracts in `.primitiv/specs/SPEC-XXX-*/contracts/`
  When the user runs `/primitiv.implement`
  Then all contract files are read during Phase 1 (Load context)
  And their full contents are available as working context

#### Scenario: Contracts injected into parallel subagent prompts
  Given a spec has `api-contract.md` and `data-contract.md` in its contracts folder
  When a multi-task wave spawns subagents
  Then each subagent prompt includes a `## Contracts` section
  And the section contains the full contents of both contract files
  And the subagent instructions state that contracts are the truth — deviation is a defect

#### Scenario: Contracts injected into single-task direct execution
  Given a spec has contracts and a single-task wave is executing directly
  When the task is implemented in the current working tree
  Then the contracts are loaded into working context before implementation begins

#### Scenario: Implementation proceeds normally when no contracts exist
  Given a spec has no contracts folder
  When the user runs `/primitiv.implement`
  Then implementation proceeds without a contracts section in the context

### Feature: ContractManager Markdown Support

The ContractManager lists both YAML and Markdown contract files.

#### Scenario: listContracts returns markdown files
  Given a spec has contracts directory containing `api-contract.md` and `schema.yaml`
  When `listContracts(specId)` is called
  Then the result includes both `api-contract.md` and `schema.yaml`

### Feature: Contract Schema Validation

Contract documents have validated frontmatter.

#### Scenario: Valid API contract frontmatter
  Given a contract file with `type: contract` and `contractType: api`
  When the frontmatter is parsed with `ContractFrontmatterSchema`
  Then validation succeeds
  And the parsed object contains `specId`, `contractType`, and `version`

#### Scenario: Invalid contract frontmatter rejected
  Given a contract file missing the `contractType` field
  When the frontmatter is parsed with `ContractFrontmatterSchema`
  Then validation fails with an error about the missing field

### Feature: Updated Subagent Prompt Template

The implement command's subagent prompt template includes contracts.

#### Scenario: Subagent prompt contains contracts section
  Given contracts exist for the current spec
  When the subagent prompt is assembled
  Then it includes a `## Contracts` section after `## Governance Context`
  And for each contract file, the section includes the filename as a heading and the full file contents
  And the instructions section includes "Contracts are the truth. Every API endpoint, request/response shape, field name, and data model MUST match the contracts exactly. Deviation from a contract is a defect."

## Test Strategy

- **Unit tests**: ContractManager markdown support, Zod schema validation for contract frontmatter
- **Integration tests**: End-to-end contract generation during plan phase (would require plan template testing)

## Constraints

- Contracts are **generated by the LLM during the plan phase**, not by deterministic code — the schema and template guide the output
- The `ContractManager` handles file I/O; the plan command template handles generation logic
- Must remain backward-compatible with existing YAML contracts

## Out of Scope

- OpenAPI/Swagger auto-generation from contracts
- Contract diffing between spec versions
- Contract validation against implementation code
- Contract generation outside the plan phase
