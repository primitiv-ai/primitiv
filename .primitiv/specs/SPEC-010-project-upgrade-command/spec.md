---
type: spec
id: SPEC-010
title: "Per-Project Upgrade Command"
status: completed
version: 2
branch: "spec/SPEC-010-project-upgrade-command"
author: "Dieu"
createdAt: "2026-04-07T00:00:00Z"
updatedAt: "2026-04-07T00:00:00Z"
---

# SPEC-010: Per-Project Upgrade Command

## Description

Add a `primitiv upgrade` CLI command that upgrades the existing Primitiv installation within a project. Unlike `primitiv update` (which only refreshes slash commands and MCP config), `upgrade` performs a **partial init** — bringing the project's `.primitiv/` directory structure, state file, and tooling up to date with the installed version of primitiv, without overwriting user data (specs, gates, constitutions, learnings, audit logs).

This solves the problem users face when they install a newer version of primitiv (e.g., one that introduced `learnings/` in SPEC-009) but their existing projects were initialized with an older version and lack the new directory structure, state fields, or slash commands.

## Current Behavior

- **`primitiv update`** (`src/commands/update.ts`): Only updates slash commands (`.claude/commands/`) and MCP config (`.mcp.json`). Does not create missing directories, migrate state files, or update templates. Reports a diff of command changes (updated/added/unchanged).
- **`primitiv init`** (`src/commands/init.ts`): Creates the full `.primitiv/` structure from scratch. Refuses to run if `.primitiv/` already exists ("already initialized" warning). Cannot be used to upgrade an existing project.
- **`ensurePrimitivDir`** (`src/utils/fileSystem.ts`): Creates `gates/`, `constitutions/`, `specs/`, `learnings/` directories. Already idempotent (uses `mkdirSync` with `recursive: true`), but is only called during init, not during update.
- **State file** (`.primitiv/.state.json`): Has `nextSpecId`, `nextFeatureId`, `nextLearningId?`, `projectRoot`, `mode`, `initializedAt`. No version tracking field exists to detect what version initialized the project.
- **`installSlashCommands`** (`src/init/installCommands.ts`): Reads from `templates/commands/`, writes to `.claude/commands/`. Lists 13 commands. Called by both init and update.
- **`installGitNexusMcp`** (`src/init/installGitNexus.ts`): Adds GitNexus to `.mcp.json`. Called by both init and update.

## Proposed Changes

### 1. State File Version Tracking

Add a `primitivVersion` field to the `StateFile` interface in `src/utils/ids.ts`:
- Records which version of primitiv initialized or last upgraded the project
- Read from `package.json` version at runtime
- Used to detect stale projects and show what changed during upgrade

### 2. Replace `primitiv update` with `primitiv upgrade`

Remove `src/commands/update.ts` and the `update` CLI registration. The `upgrade` command replaces `update` entirely, performing everything `update` did plus directory sync and state migration.

### 3. `primitiv upgrade` CLI Command (`src/commands/upgrade.ts`)

New command that performs a partial init:

1. **Validate** — assert git repo, assert primitiv is initialized
2. **Detect installed version** — read `primitivVersion` from `.state.json` (absent = pre-1.0.3)
3. **Upgrade directory structure** — call `ensurePrimitivDir()` to create any missing directories (e.g., `learnings/` for projects initialized before SPEC-009)
4. **Migrate state file** — add missing fields with defaults (`nextLearningId: 1`, `primitivVersion: current`)
5. **Update slash commands** — call `installSlashCommands()` with change detection (reuse diff logic from old `update` command)
6. **Update MCP config** — call `installGitNexusMcp()`
7. **Write updated state** — save state file with `primitivVersion` set to current version
8. **Report summary** — show what changed: new directories, migrated fields, command updates

No GitNexus re-indexing — keeps the command fast.

### 4. CLI Registration

Register `primitiv upgrade` in `src/cli.ts`. Remove `primitiv update` registration.

### 4. Version Utility

Add a `getPackageVersion()` function in `src/utils/version.ts` that reads the version from the package's own `package.json` at runtime (for use by both upgrade and the existing `--version` flag).

## Acceptance Criteria

### Feature: Project Upgrade

Upgrades an existing Primitiv project to match the current installed version.

#### Background:
  Given Primitiv is initialized in a project directory
  And the user has installed a newer version of the primitiv package

#### Scenario: Upgrade creates missing directories
  Given the project was initialized before SPEC-009 (no `learnings/` directory)
  When the user runs `primitiv upgrade`
  Then `.primitiv/learnings/` directory is created
  And existing directories (`specs/`, `gates/`, `constitutions/`) are preserved
  And no existing files are deleted or overwritten

#### Scenario: Upgrade migrates state file with missing fields
  Given the state file lacks `nextLearningId` and `primitivVersion`
  When the user runs `primitiv upgrade`
  Then `nextLearningId` is set to 1 in the state file
  And `primitivVersion` is set to the current package version
  And existing fields (`nextSpecId`, `nextFeatureId`, `mode`) are preserved

#### Scenario: Upgrade updates slash commands
  Given the installed commands are outdated (templates have changed)
  When the user runs `primitiv upgrade`
  Then all slash commands in `.claude/commands/` are updated from templates
  And a summary shows how many commands were updated, added, or unchanged

#### Scenario: Upgrade updates MCP config
  Given `.mcp.json` exists but may be missing GitNexus
  When the user runs `primitiv upgrade`
  Then GitNexus is present in `.mcp.json`

#### Scenario: Upgrade reports version transition
  Given the state file has `primitivVersion: "1.0.2"`
  And the current package version is "1.0.3"
  When the user runs `primitiv upgrade`
  Then the output shows "Upgrading from 1.0.2 → 1.0.3"
  And the state file `primitivVersion` is updated to "1.0.3"

#### Scenario: Upgrade on already up-to-date project
  Given the state file `primitivVersion` matches the current package version
  When the user runs `primitiv upgrade`
  Then the output shows "Already up to date"
  But slash commands and MCP config are still refreshed

#### Scenario: Upgrade fails on uninitialized project
  Given `.primitiv/` directory does not exist
  When the user runs `primitiv upgrade`
  Then an error message is shown: "Not initialized. Run `primitiv init` first."
  And the exit code is 1

#### Scenario: Upgrade fails outside git repo
  Given the directory is not a git repository
  When the user runs `primitiv upgrade`
  Then an error message is shown: "Not a git repository"
  And the exit code is 1

### Feature: State File Version Tracking

The state file records which version of primitiv last upgraded the project.

#### Scenario: Init sets primitivVersion
  Given a new project is being initialized
  When the user runs `primitiv init`
  Then the state file includes `primitivVersion` set to the current package version

#### Scenario: Upgrade updates primitivVersion
  Given the state file has `primitivVersion: "1.0.0"`
  When the user runs `primitiv upgrade`
  Then `primitivVersion` is updated to the current package version

## Test Strategy

- **Unit tests**: State file migration (add missing fields, preserve existing), version detection
- **Integration tests**: `primitiv upgrade` command (directory creation, command updates, state migration, error cases)
- **Regression tests**: Existing `init` and `update` commands still work

## Constraints

- Must not delete or overwrite any user data (specs, gates, constitutions, learnings, audit logs, research)
- Must be idempotent — running `upgrade` twice produces the same result
- Must work with state files from any previous version (graceful defaults for missing fields)
- The `primitivVersion` field is optional in the state file interface for backwards compatibility

## Out of Scope

- Global package upgrade (`npm update -g primitiv`) — this is npm's job, not primitiv's
- Data migrations (e.g., converting spec formats between versions) — if needed, that's a separate migration command
- Automatic upgrade detection on CLI start (no "upgrade available" prompts)
- Rollback functionality
