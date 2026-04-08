---
type: tasks
version: 1
specId: SPEC-012
tasks:
  - id: TASK-001
    title: "Rename template files and update template registry"
    description: "git mv the gate-1/gate-2 template files to company-principles/security-principles. Update getCommandTemplateNames() in src/init/templates.ts."
    status: completed
    files:
      - "templates/commands/primitiv.gate-1.md"
      - "templates/commands/primitiv.gate-2.md"
      - "templates/commands/primitiv.company-principles.md"
      - "templates/commands/primitiv.security-principles.md"
      - "src/init/templates.ts"
    acceptanceCriteria:
      - "Feature: Renamed Slash Commands > Scenario: New command names are available after init"
    dependsOn: []
  - id: TASK-002
    title: "Add deprecated command cleanup to upgrade"
    description: "Add DEPRECATED_COMMANDS array to src/commands/upgrade.ts. After installSlashCommands(), delete old gate-1.md and gate-2.md from .claude/commands/. Also regenerate .primitiv/README.md from the template. Report removed count in summary."
    status: completed
    files:
      - "src/commands/upgrade.ts"
    acceptanceCriteria:
      - "Feature: Upgrade Removes Old Commands > Scenario: Upgrade replaces old gate commands with new names"
      - "Feature: Upgrade Removes Old Commands > Scenario: Upgrade regenerates project README"
    dependsOn: ["TASK-001"]
  - id: TASK-003
    title: "Update cross-references in source files"
    description: "Update gate-1/gate-2 references in src/commands/init.ts (NEXT_STEPS constant + runNonInteractive output) and src/engine/MigrationManager.ts (warning messages at lines 651/655)."
    status: completed
    files:
      - "src/commands/init.ts"
      - "src/engine/MigrationManager.ts"
    acceptanceCriteria:
      - "Feature: Cross-References Updated > Scenario: Specify command references new names"
    dependsOn: []
  - id: TASK-004
    title: "Update cross-references in template files"
    description: "Update gate-1/gate-2 references in templates/commands/primitiv.specify.md (drop 'Gate N' prefix from output format), primitiv.compile.md, primitiv.migrate.md, and templates/specs/README.md."
    status: completed
    files:
      - "templates/commands/primitiv.specify.md"
      - "templates/commands/primitiv.compile.md"
      - "templates/commands/primitiv.migrate.md"
      - "templates/specs/README.md"
    acceptanceCriteria:
      - "Feature: Gate Numbers Dropped From Output > Scenario: Specify output uses descriptive names"
      - "Feature: Cross-References Updated > Scenario: Specify command references new names"
    dependsOn: []
  - id: TASK-005
    title: "Update README.md"
    description: "Update How It Works diagram, slash commands table, and amend examples in README.md to use new command names."
    status: completed
    files:
      - "README.md"
    acceptanceCriteria:
      - "Feature: Cross-References Updated > Scenario: README uses new command names"
    dependsOn: []
  - id: TASK-006
    title: "Update tests"
    description: "Update tests/init-wizard.test.ts to expect primitiv.company-principles.md instead of primitiv.gate-1.md."
    status: completed
    files:
      - "tests/init-wizard.test.ts"
    acceptanceCriteria:
      - "Feature: Renamed Slash Commands > Scenario: New command names are available after init"
      - "Feature: Internal Status Names Unchanged > Scenario: State machine still uses gate-N-passed"
    dependsOn: ["TASK-001"]
updatedAt: "2026-04-08T13:20:00Z"
---

# Tasks — SPEC-012: Rename Gate Commands

## TASK-001: Rename template files and update template registry

**Files:** `templates/commands/primitiv.gate-1.md` → `primitiv.company-principles.md`, `templates/commands/primitiv.gate-2.md` → `primitiv.security-principles.md`, `src/init/templates.ts`

git mv the template files and update the `getCommandTemplateNames()` array to reference the new filenames.

---

## TASK-002: Add deprecated command cleanup to upgrade

**Files:** `src/commands/upgrade.ts`
**Depends on:** TASK-001

Add a `DEPRECATED_COMMANDS` array (`["primitiv.gate-1.md", "primitiv.gate-2.md"]`). After `installSlashCommands()`, iterate the array and `unlinkSync` any that exist in `.claude/commands/`. Also regenerate `.primitiv/README.md` from the template. Include removed count in summary.

---

## TASK-003: Update cross-references in source files

**Files:** `src/commands/init.ts`, `src/engine/MigrationManager.ts`

- `init.ts`: Update `NEXT_STEPS` constant and `runNonInteractive()` output
- `MigrationManager.ts`: Update warning messages at lines 651/655

---

## TASK-004: Update cross-references in template files

**Files:** `templates/commands/primitiv.specify.md`, `primitiv.compile.md`, `primitiv.migrate.md`, `templates/specs/README.md`

- `specify.md`: Drop "Gate N" prefix from output format section
- `compile.md`: `/primitiv.gate-2` → `/primitiv.security-principles`
- `migrate.md`: Both gate refs
- `specs/README.md`: Pipeline diagram and gate references

---

## TASK-005: Update README.md

**Files:** `README.md`

Update How It Works diagram, slash commands table, and amend examples to use `/primitiv.company-principles` and `/primitiv.security-principles`.

---

## TASK-006: Update tests

**Files:** `tests/init-wizard.test.ts`
**Depends on:** TASK-001

Update expected command names from `primitiv.gate-1.md` to `primitiv.company-principles.md`.
