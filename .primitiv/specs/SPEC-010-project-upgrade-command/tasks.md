---
type: tasks
version: 1
specId: SPEC-010
tasks:
  - id: TASK-001
    title: "Create getPackageVersion utility and add primitivVersion to StateFile"
    description: "Create src/utils/version.ts with getPackageVersion() that reads the package version from the package's own package.json at runtime using import.meta.url. Add optional primitivVersion field to StateFile interface in src/utils/ids.ts."
    status: completed
    files:
      - "src/utils/version.ts"
      - "src/utils/ids.ts"
    acceptanceCriteria:
      - "Feature: State File Version Tracking > Scenario: Init sets primitivVersion"
      - "Feature: State File Version Tracking > Scenario: Upgrade updates primitivVersion"
    dependsOn: []
  - id: TASK-002
    title: "Update init flows to set primitivVersion"
    description: "Modify greenfield.ts and brownfield.ts to include primitivVersion: getPackageVersion() in the saveState() call. Export getPackageVersion from src/index.ts."
    status: completed
    files:
      - "src/init/greenfield.ts"
      - "src/init/brownfield.ts"
      - "src/index.ts"
    acceptanceCriteria:
      - "Feature: State File Version Tracking > Scenario: Init sets primitivVersion"
    dependsOn:
      - "TASK-001"
  - id: TASK-003
    title: "Implement primitiv upgrade command and replace update"
    description: "Create src/commands/upgrade.ts with runUpgrade() that validates, syncs directories, migrates state, detects command changes, installs commands, updates MCP, and reports a summary. Move detectChanges() and CommandDiff from update.ts. Delete src/commands/update.ts. Modify src/cli.ts to replace update registration with upgrade and use getPackageVersion() for --version."
    status: completed
    files:
      - "src/commands/upgrade.ts"
      - "src/commands/update.ts"
      - "src/cli.ts"
    acceptanceCriteria:
      - "Feature: Project Upgrade > Scenario: Upgrade creates missing directories"
      - "Feature: Project Upgrade > Scenario: Upgrade migrates state file with missing fields"
      - "Feature: Project Upgrade > Scenario: Upgrade updates slash commands"
      - "Feature: Project Upgrade > Scenario: Upgrade updates MCP config"
      - "Feature: Project Upgrade > Scenario: Upgrade reports version transition"
      - "Feature: Project Upgrade > Scenario: Upgrade on already up-to-date project"
      - "Feature: Project Upgrade > Scenario: Upgrade fails on uninitialized project"
      - "Feature: Project Upgrade > Scenario: Upgrade fails outside git repo"
    dependsOn:
      - "TASK-001"
  - id: TASK-004
    title: "Write upgrade command tests and delete old update tests"
    description: "Create tests/upgrade.test.ts with integration tests for all upgrade scenarios (dir sync, state migration, command diff, version transition, error cases, idempotency). Delete tests/update-enhanced.test.ts."
    status: completed
    files:
      - "tests/upgrade.test.ts"
      - "tests/update-enhanced.test.ts"
    acceptanceCriteria:
      - "Feature: Project Upgrade > Scenario: Upgrade creates missing directories"
      - "Feature: Project Upgrade > Scenario: Upgrade migrates state file with missing fields"
      - "Feature: Project Upgrade > Scenario: Upgrade updates slash commands"
      - "Feature: Project Upgrade > Scenario: Upgrade reports version transition"
      - "Feature: Project Upgrade > Scenario: Upgrade on already up-to-date project"
      - "Feature: Project Upgrade > Scenario: Upgrade fails on uninitialized project"
      - "Feature: Project Upgrade > Scenario: Upgrade fails outside git repo"
    dependsOn:
      - "TASK-003"
updatedAt: "2026-04-07T00:00:00Z"
---

# Tasks — SPEC-010: Per-Project Upgrade Command

## TASK-001: Create getPackageVersion utility and add primitivVersion to StateFile
**Status:** pending | **Depends on:** none

Create `src/utils/version.ts`:
- `getPackageVersion()` — uses `import.meta.url` to walk up from the module file to find the nearest `package.json`, reads its `version` field, falls back to `"0.0.0"` on failure
- Named export, no dependencies

Modify `src/utils/ids.ts`:
- Add `primitivVersion?: string` to `StateFile` interface (optional for backwards compat)

**Files:** `src/utils/version.ts`, `src/utils/ids.ts`

---

## TASK-002: Update init flows to set primitivVersion
**Status:** pending | **Depends on:** TASK-001

Modify `src/init/greenfield.ts`:
- Import `getPackageVersion` from `../utils/version.js`
- Add `primitivVersion: getPackageVersion()` to the `saveState()` call

Modify `src/init/brownfield.ts`:
- Same changes as greenfield

Modify `src/index.ts`:
- Add `export { getPackageVersion } from "./utils/version.js"`

**Files:** `src/init/greenfield.ts`, `src/init/brownfield.ts`, `src/index.ts`

---

## TASK-003: Implement primitiv upgrade command and replace update
**Status:** pending | **Depends on:** TASK-001

Create `src/commands/upgrade.ts`:
- Move `detectChanges()` and `CommandDiff` from `update.ts`
- Implement `runUpgrade(projectRoot)`:
  1. Validate (assertGitRepo + isPrimitivInitialized)
  2. Load state, get package version, compare versions
  3. Call ensurePrimitivDir() to create missing directories
  4. Migrate state: set `nextLearningId ?? 1`, `primitivVersion`
  5. Detect command changes + installSlashCommands + installGitNexusMcp
  6. Save state with updated primitivVersion
  7. Display summary via renderBox

Delete `src/commands/update.ts`

Modify `src/cli.ts`:
- Remove update import and registration
- Add upgrade import and registration
- Use `getPackageVersion()` for `.version()` instead of hardcoded `"0.2.0"`

**Files:** `src/commands/upgrade.ts`, `src/commands/update.ts`, `src/cli.ts`

---

## TASK-004: Write upgrade command tests and delete old update tests
**Status:** pending | **Depends on:** TASK-003

Create `tests/upgrade.test.ts`:
- Follow mock pattern from `tests/update-enhanced.test.ts` (mock templates, installSlashCommands, installGitNexusMcp)
- Test scenarios:
  - Upgrade creates missing directories
  - Upgrade migrates state file (adds nextLearningId, primitivVersion)
  - Upgrade preserves existing state fields
  - Upgrade reports version transition ("Upgrading from X → Y")
  - Upgrade on up-to-date project ("Already up to date")
  - Upgrade fails on uninitialized project
  - Upgrade fails outside git repo
  - Idempotency (two runs produce same result)
  - Command diff detection (updated/added/unchanged)

Delete `tests/update-enhanced.test.ts`

**Files:** `tests/upgrade.test.ts`, `tests/update-enhanced.test.ts`
