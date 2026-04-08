---
type: plan
version: 1
specId: SPEC-010
approach: "Replace primitiv update with primitiv upgrade — adds directory sync, state migration, and version tracking on top of existing command/MCP refresh"
fileChanges:
  - path: "src/utils/version.ts"
    action: create
    description: "getPackageVersion() utility — reads version from package's own package.json at runtime"
  - path: "src/utils/ids.ts"
    action: modify
    description: "Add optional primitivVersion field to StateFile interface"
  - path: "src/commands/upgrade.ts"
    action: create
    description: "runUpgrade() — validates, syncs dirs, migrates state, updates commands with diff detection, updates MCP, reports summary"
  - path: "src/commands/update.ts"
    action: delete
    description: "Remove old update command — replaced entirely by upgrade"
  - path: "src/cli.ts"
    action: modify
    description: "Replace update command registration with upgrade, use getPackageVersion for --version"
  - path: "src/init/greenfield.ts"
    action: modify
    description: "Set primitivVersion in initial state"
  - path: "src/init/brownfield.ts"
    action: modify
    description: "Set primitivVersion in initial state"
  - path: "src/index.ts"
    action: modify
    description: "Export getPackageVersion from utils/version"
  - path: "tests/upgrade.test.ts"
    action: create
    description: "Integration tests for primitiv upgrade (dir sync, state migration, command diff, error cases)"
  - path: "tests/update-enhanced.test.ts"
    action: delete
    description: "Remove old update command tests — replaced by upgrade tests"
risks:
  - "Removing primitiv update is a breaking change for users who have it in scripts — mitigated by the command being rarely scripted and the CHANGELOG documenting the change"
  - "getPackageVersion() must resolve the correct package.json in both dev (project root) and installed (node_modules) contexts — needs careful path resolution"
dependencies: []
codebaseAnalysis:
  existingCode:
    - "src/commands/update.ts — runUpdate() with detectChanges() diff logic (CommandDiff interface). This is the primary code to absorb into upgrade."
    - "src/init/brownfield.ts — initBrownfield() calls ensurePrimitivDir + saveState + installSlashCommands + installGitNexusMcp"
    - "src/init/greenfield.ts — initGreenfield() same pattern"
    - "src/utils/ids.ts — StateFile interface, loadState/saveState functions"
    - "src/utils/fileSystem.ts — ensurePrimitivDir (already idempotent, creates all dirs)"
    - "src/init/installCommands.ts — installSlashCommands()"
    - "src/init/installGitNexus.ts — installGitNexusMcp()"
    - "src/ui/banner.ts — renderCompactBanner() for upgrade output"
    - "src/ui/box.ts — renderBox() for summary display"
    - "tests/update-enhanced.test.ts — existing tests for the update command diff logic"
  reusableModules:
    - "detectChanges() from src/commands/update.ts — move into upgrade.ts (CommandDiff interface, template comparison logic)"
    - "installSlashCommands() from src/init/installCommands.ts — called directly"
    - "installGitNexusMcp() from src/init/installGitNexus.ts — called directly"
    - "ensurePrimitivDir() from src/utils/fileSystem.ts — called directly for dir sync"
    - "loadState()/saveState() from src/utils/ids.ts — for state migration"
    - "renderCompactBanner()/renderBox() from src/ui/ — for output formatting"
    - "assertGitRepo()/isPrimitivInitialized() — for validation"
  patternsToFollow:
    - "CLI command in src/commands/ with async runX function (see update.ts, compile.ts)"
    - "State file read/modify/write pattern (see ids.ts loadState/saveState)"
    - "Commander registration in src/cli.ts (see existing update/compile commands)"
    - "Test mocking pattern from tests/update-enhanced.test.ts (mock templates, installSlashCommands, installGitNexusMcp)"
updatedAt: "2026-04-07T00:00:00Z"
---

# Technical Plan — SPEC-010: Per-Project Upgrade Command

## Approach

Move the `detectChanges()` diff logic from `src/commands/update.ts` into a new `src/commands/upgrade.ts`, add directory sync (`ensurePrimitivDir`), state file migration (add missing fields + `primitivVersion`), and version reporting. Delete the old update command and its tests. Update init flows to set `primitivVersion` on new projects.

## Codebase Analysis

### What Already Exists

The `update` command (`src/commands/update.ts`) already does 80% of what upgrade needs — it validates, detects command changes, installs commands, and updates MCP. The upgrade command wraps this with directory sync and state migration.

The `ensurePrimitivDir()` function is already idempotent — calling it on an existing project safely creates only missing directories without touching existing ones.

The `StateFile` interface already has an optional `nextLearningId?` field, establishing the pattern for optional fields with backwards compatibility.

### Key Decision: Version Resolution

The CLI currently hardcodes the version (`"0.2.0"` in cli.ts). A `getPackageVersion()` utility will read it from the package's own `package.json` at runtime using `import.meta.url` to resolve the correct file regardless of whether running from source or from `node_modules`.

## File Changes

### 1. `src/utils/version.ts` (CREATE)
*Feature: State File Version Tracking > both scenarios*

```typescript
export function getPackageVersion(): string
```

Uses `import.meta.url` to find the package root and read `package.json` version. Falls back to `"0.0.0"` if resolution fails.

### 2. `src/utils/ids.ts` (MODIFY)
*Feature: State File Version Tracking > Init sets primitivVersion*

Add `primitivVersion?: string` to the `StateFile` interface (optional for backwards compat).

### 3. `src/commands/upgrade.ts` (CREATE)
*Feature: Project Upgrade > all scenarios*

Contains:
- `detectChanges()` — moved from `update.ts` (CommandDiff interface + template comparison)
- `runUpgrade(projectRoot: string)` — main function:
  1. `assertGitRepo()` + `isPrimitivInitialized()` checks
  2. `loadState()` to read current state
  3. `getPackageVersion()` to get current version
  4. Compare `state.primitivVersion` vs current → report transition or "already up to date"
  5. `ensurePrimitivDir()` to create missing directories
  6. Migrate state: set defaults for missing fields (`nextLearningId ?? 1`, `primitivVersion`)
  7. `detectChanges()` + `installSlashCommands()`
  8. `installGitNexusMcp()`
  9. `saveState()` with updated `primitivVersion`
  10. Display summary via `renderBox()`

### 4. `src/commands/update.ts` (DELETE)
*Clarification: Replace update with upgrade*

Remove entirely. All logic absorbed into `upgrade.ts`.

### 5. `src/cli.ts` (MODIFY)
*Feature: Project Upgrade > all scenarios*

- Remove `import { runUpdate }` and the `update` command registration
- Add `import { runUpgrade }` and register `upgrade` command
- Use `getPackageVersion()` for the `.version()` call instead of hardcoded `"0.2.0"`

### 6. `src/init/greenfield.ts` (MODIFY)
*Feature: State File Version Tracking > Init sets primitivVersion*

Add `primitivVersion: getPackageVersion()` to the `saveState()` call.

### 7. `src/init/brownfield.ts` (MODIFY)
*Feature: State File Version Tracking > Init sets primitivVersion*

Add `primitivVersion: getPackageVersion()` to the `saveState()` call.

### 8. `src/index.ts` (MODIFY)
*SDK exports*

Add `export { getPackageVersion } from "./utils/version.js"`.

### 9. `tests/upgrade.test.ts` (CREATE)
*Feature: Project Upgrade > all scenarios*

Integration tests following the mock pattern from `tests/update-enhanced.test.ts`:
- Upgrade creates missing directories
- Upgrade migrates state file (adds missing fields, preserves existing)
- Upgrade updates slash commands (with diff summary)
- Upgrade reports version transition
- Upgrade on already up-to-date project
- Upgrade fails on uninitialized project
- Upgrade fails outside git repo
- Idempotency (running twice produces same result)

### 10. `tests/update-enhanced.test.ts` (DELETE)
*Clarification: Replace update with upgrade*

Remove — the upgrade tests cover the same diff detection logic.

## Architecture

```
CLI
 └── primitiv upgrade
       ├── assertGitRepo() + isPrimitivInitialized()
       ├── loadState() → detect primitivVersion
       ├── getPackageVersion() → compare versions
       ├── ensurePrimitivDir() → sync directories
       ├── migrate state fields (nextLearningId, primitivVersion)
       ├── detectChanges() → diff commands
       ├── installSlashCommands() → overwrite commands
       ├── installGitNexusMcp() → update MCP
       ├── saveState() → persist migrated state
       └── renderBox() → display summary
```

## Risks

1. **Breaking change** — Users with `primitiv update` in scripts will get "unknown command". Mitigated by documenting in CHANGELOG.
2. **Version resolution** — `getPackageVersion()` must work in both dev mode (project root) and installed mode (`node_modules/primitiv`). Using `import.meta.url` handles both.
3. **State file corruption** — If upgrade crashes mid-write, state file could be lost. Mitigated by writing atomically (single `writeFileSync` call, already the pattern used by `saveState`).

## Dependencies

None — no new external dependencies required.
