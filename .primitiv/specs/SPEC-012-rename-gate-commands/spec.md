---
type: spec
id: SPEC-012
title: "Rename Gate Commands to Descriptive Names"
status: tested
version: 1
branch: "spec/SPEC-012-rename-gate-commands"
author: "Dieu"
createdAt: "2026-04-08T13:00:00Z"
updatedAt: "2026-04-08T13:00:00Z"
---

# SPEC-012: Rename Gate Commands to Descriptive Names

## Description

Rename the gate slash commands from numbered names to descriptive names:

- `/primitiv.gate-1` → `/primitiv.company-principles`
- `/primitiv.gate-2` → `/primitiv.security-principles`

The numbered "gate-1" / "gate-2" naming is opaque — users have to remember which gate is which. The new names are self-documenting: you know exactly what `/primitiv.company-principles` does without checking docs.

## Current Behavior

The gate commands exist as:

**Template files:**
- `templates/commands/primitiv.gate-1.md` — generates/amends company principles
- `templates/commands/primitiv.gate-2.md` — generates/amends security principles

**Installed commands:**
- `.claude/commands/primitiv.gate-1.md`
- `.claude/commands/primitiv.gate-2.md`

**Template registration** (`src/init/templates.ts:22-23`):
```typescript
"primitiv.gate-1.md",
"primitiv.gate-2.md",
```

**References across the codebase** (20 files reference `primitiv.gate-1` or `primitiv.gate-2`):
- Command templates: `primitiv.compile.md`, `primitiv.specify.md`, `primitiv.migrate.md` reference gate commands in their instructions
- `README.md` — slash commands table and How It Works diagram
- `src/commands/init.ts` — wizard output references gate commands
- `src/init/templates.ts` — template file list
- `src/engine/MigrationManager.ts` — migration references gate commands
- `tests/init-wizard.test.ts` — tests reference gate command names
- `.primitiv/README.md` and `templates/specs/README.md` — user-facing docs
- Historical spec files (SPEC-002, SPEC-003, SPEC-005) — these are frozen records, do NOT modify

**State machine status names** (`src/schemas/common.ts:14-16`):
- `"gate-1-passed"`, `"gate-2-passed"`, `"gate-3-passed"`
- These are internal status identifiers used in spec lifecycle transitions — **NOT renamed** (they are data, not UI)

## Proposed Changes

1. **Rename template files:**
   - `templates/commands/primitiv.gate-1.md` → `templates/commands/primitiv.company-principles.md`
   - `templates/commands/primitiv.gate-2.md` → `templates/commands/primitiv.security-principles.md`

2. **Update template registration** in `src/init/templates.ts`:
   - `"primitiv.gate-1.md"` → `"primitiv.company-principles.md"`
   - `"primitiv.gate-2.md"` → `"primitiv.security-principles.md"`

3. **Update all cross-references** in active template/source files:
   - `templates/commands/primitiv.compile.md`
   - `templates/commands/primitiv.specify.md`
   - `templates/commands/primitiv.migrate.md`
   - `templates/specs/README.md`
   - `src/commands/init.ts`
   - `src/engine/MigrationManager.ts`
   - `README.md`

4. **Update tests:**
   - `tests/init-wizard.test.ts` — update expected command names

5. **Upgrade path** — `primitiv upgrade` must:
   - Install the new command files (`primitiv.company-principles.md`, `primitiv.security-principles.md`)
   - Remove the old command files via a hardcoded `DEPRECATED_COMMANDS` array: `['primitiv.gate-1.md', 'primitiv.gate-2.md']`
   - Regenerate `.primitiv/README.md` from the updated template

6. **Drop gate numbers from output** — The specify command template output changes:
   - `Gate 1 (Company Principles): Passed` → `Company Principles: Passed`
   - `Gate 2 (Security Principles): Passed` → `Security Principles: Passed`
   - `Gate 3 (Constitutions): ...` → `Constitutions: ...`

6. **Do NOT modify:**
   - `src/schemas/common.ts` — `gate-1-passed`, `gate-2-passed` status names stay (internal data)
   - `src/state/specStateMachine.ts` — transition map stays as-is
   - Historical spec files in `.primitiv/specs/SPEC-00X-*` — frozen records

## Acceptance Criteria

### Feature: Renamed Slash Commands

Gate commands use descriptive names instead of numbered identifiers.

#### Scenario: New command names are available after init
  Given a new project directory
  When the user runs `primitiv init`
  Then `.claude/commands/primitiv.company-principles.md` is created
  And `.claude/commands/primitiv.security-principles.md` is created
  And `.claude/commands/primitiv.gate-1.md` does NOT exist
  And `.claude/commands/primitiv.gate-2.md` does NOT exist

#### Scenario: Commands work with generate and amend
  Given a Primitiv project with the new commands installed
  When the user runs `/primitiv.company-principles generate <description>`
  Then company principles are generated in `.primitiv/gates/company-principles.md`
  When the user runs `/primitiv.security-principles amend <change>`
  Then security principles are amended in `.primitiv/gates/security-principles.md`

### Feature: Upgrade Removes Old Commands

Existing projects get the new names and old files cleaned up.

#### Scenario: Upgrade replaces old gate commands with new names
  Given a project initialized with primitiv <= 1.0.4 (has `primitiv.gate-1.md` and `primitiv.gate-2.md`)
  When the user runs `primitiv upgrade`
  Then `.claude/commands/primitiv.company-principles.md` is created
  And `.claude/commands/primitiv.security-principles.md` is created
  And `.claude/commands/primitiv.gate-1.md` is deleted
  And `.claude/commands/primitiv.gate-2.md` is deleted

#### Scenario: Upgrade regenerates project README
  Given a project with an outdated `.primitiv/README.md` referencing gate-1/gate-2
  When the user runs `primitiv upgrade`
  Then `.primitiv/README.md` is regenerated from the template
  And it references `/primitiv.company-principles` and `/primitiv.security-principles`

### Feature: Cross-References Updated

All active templates and source files reference the new command names.

#### Scenario: Specify command references new names
  Given the `/primitiv.specify` command template
  Then it references `/primitiv.company-principles` instead of `/primitiv.gate-1`
  And it references `/primitiv.security-principles` instead of `/primitiv.gate-2`

#### Scenario: README uses new command names
  Given the project README
  Then the slash commands table lists `/primitiv.company-principles` and `/primitiv.security-principles`
  And the How It Works diagram uses the new names

### Feature: Gate Numbers Dropped From Output

User-facing output uses descriptive names without numbered prefixes.

#### Scenario: Specify output uses descriptive names
  Given a spec passes all gate checks
  Then the output shows `Company Principles: Passed` (not `Gate 1 (Company Principles): Passed`)
  And the output shows `Security Principles: Passed` (not `Gate 2 (Security Principles): Passed`)
  And the output shows `Constitutions: Passed` (not `Gate 3 (Constitutions): Passed`)

### Feature: Internal Status Names Unchanged

The spec lifecycle status names remain stable.

#### Scenario: State machine still uses gate-N-passed
  Given the spec state machine
  Then status `gate-1-passed` is still a valid status
  And status `gate-2-passed` is still a valid status
  And existing specs with these statuses remain valid

## Test Strategy

- **Unit tests**: Update `tests/init-wizard.test.ts` to expect new command names
- **Integration tests**: Verify upgrade removes old files and installs new ones

## Constraints

- Internal status names (`gate-1-passed`, `gate-2-passed`) must NOT change — they are stored data in spec frontmatter across all existing projects
- Historical spec files are frozen records — do not modify
- Must be backward-compatible via `primitiv upgrade`

## Out of Scope

- Renaming `gate-3-passed` or the constitution command
- Renaming the `gates/` directory in `.primitiv/`
- Renaming `GateType` or `GateManager` in the SDK
