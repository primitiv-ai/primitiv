---
type: spec
id: SPEC-008
title: "CLI Installer & Updater Wizard"
status: completed
version: 6
branch: "spec/SPEC-008-cli-installer-updater-wizard"
author: "Dieu"
createdAt: "2026-04-06T14:00:00.000Z"
updatedAt: "2026-04-06T15:15:00.000Z"
---

# SPEC-008: CLI Installer & Updater Wizard

## Description

Primitiv is not on npm. Today, the only way to use it is to clone the repo. That's unacceptable for a public launch. Users should never have to clone anything.

This spec has two deliverables:

1. **Publish `primitiv-spec-engine` to npm** so it's installable via `npx` with zero setup
2. **Build a premium installer wizard** with ASCII art, animations, and interactive menus — because `npx primitiv install` is the project's front door

After this spec, the Primitiv commands are:
```
npx primitiv install    # One-time: global install + interactive wizard
primitiv init           # Project init (non-interactive, for scripts/CI)
primitiv update         # Update commands & config to latest version
primitiv status         # Show pipeline state
primitiv compile        # Compile governance context
...                     # All other primitiv commands
```
One command. No clone. No global install. No manual file copying.

This requires **renaming the npm package** from `primitiv-spec-engine` to `primitiv` (or `primitiv-cli` as fallback) — shorter, cleaner, and matches the CLI binary name. The GitHub repo stays `primitiv-spec-engine`.

## Current Behavior

### `primitiv init` (`src/commands/init.ts`)

Currently a synchronous, non-interactive command:
1. Checks for git repo and existing initialization
2. Accepts `--greenfield` or `--brownfield` flags (defaults to brownfield)
3. Creates `.primitiv/` directory structure, writes `.state.json`
4. Copies 12 slash command templates to `.claude/commands/`
5. Writes `.mcp.json` for GitNexus
6. Prints plain chalk log lines (`chalk.blue`, `chalk.green`)
7. Shows next steps as static text

No interactivity, no animation, no visual identity. No mode selection menu — the user must know about `--greenfield`/`--brownfield` flags.

### `primitiv update` (`src/commands/update.ts`)

A 21-line function that:
1. Asserts git repo and initialization
2. Calls `installSlashCommands()` and `installGitNexusMcp()`
3. Prints 3 lines of chalk output

No version comparison, no diff of what changed, no progress indication.

### Visual Dependencies

Currently uses `chalk` (^5.3.0) and `cli-table3` (^0.6.5). No spinners, prompts, ASCII art, or animation libraries.

### Relevant Source Files

| File | Role |
|------|------|
| `src/cli.ts` | CLI command definitions (commander) |
| `src/commands/init.ts` | Init command handler |
| `src/commands/update.ts` | Update command handler |
| `src/init/greenfield.ts` | Greenfield initialization logic |
| `src/init/brownfield.ts` | Brownfield initialization logic |
| `src/init/installCommands.ts` | Slash command installer |
| `src/init/installGitNexus.ts` | MCP config installer |
| `src/init/templates.ts` | Template loader |
| `bin/primitiv.ts` | CLI entry point |
| `package.json` | Dependencies, bin field, npm publish config |

## Proposed Changes

### 0. npm Publishing & Package Readiness

Make the package publishable and usable via `npx`:

- **Rename package** from `primitiv-spec-engine` to `primitiv` in `package.json` (fallback: `primitiv-cli` if `primitiv` is taken on npm)
- Verify `package.json` fields: `name`, `version`, `bin`, `files`, `description`, `repository`, `license`, `keywords`, `engines`
- Add `repository`, `license` (MIT), `keywords`, and `engines` fields if missing
- Ensure `files` array includes everything needed: `dist/`, `templates/`
- Ensure `bin` entry (`"primitiv": "dist/bin/primitiv.js"`) works after `npx` downloads the package
- Add a `prepublishOnly` script that runs `npm run build` (already exists)
- Verify the build produces a working `dist/` — fix the existing TypeScript errors in `GovernanceCompiler.ts` that block `tsc`
- Bump version from `0.2.0` to `1.0.0` — public launch
- Publish to npm as `primitiv` (public, unscoped; fallback: `primitiv-cli`)
- After publish, `npx primitiv install`, `npx primitiv init`, and `npx primitiv update` must work end-to-end

### 0.5. CI/CD Pipeline with GitHub Actions

Set up automated build, test, and publish pipeline:

- **CI workflow** (`.github/workflows/ci.yml`) — runs on every push and PR to `main`:
  - Install dependencies
  - Run `tsc --noEmit` (type check)
  - Run `vitest run` (full test suite)
  - Fail the PR if either step fails

- **Publish workflow** (`.github/workflows/publish.yml`) — runs on GitHub Release creation:
  - Triggered by `release` event (published)
  - Builds the project (`npm run build`)
  - Publishes to npm using `NPM_TOKEN` secret
  - Tags the npm package with the release version

- **npm token** — stored as `NPM_TOKEN` repository secret (manual one-time setup by the repo owner)

### 1. ASCII Art Banner & Visual Identity

Create a Primitiv ASCII art logo displayed on `init` and as a compact header on `update`. The banner sets the visual tone — monochrome or gradient, clean geometry, recognizable at a glance.

Add a version display and tagline beneath the banner.

### 2. New `install` Command — Global Install + Project Init Wizard

`npx primitiv install` does two things in sequence:

1. **Installs `primitiv` globally** via `npm install -g primitiv` — so the `primitiv` command is available system-wide without `npx` prefix going forward
2. **Runs the interactive init wizard** (identical to `primitiv init`) — ASCII art, mode selection, stack detection, animated progress, success screen

`primitiv init` is the **same interactive wizard** — ASCII art banner, greenfield/brownfield menu, animations — but without the global install step. It's what users run in new projects after Primitiv is already on their system.

| Command | Purpose | Global Install | Interactive | Animations |
|---------|---------|---------------|-------------|------------|
| `npx primitiv install` | First-time — global install + wizard | Yes | Yes | Yes |
| `primitiv init` | Project init — same wizard, no global install | No | Yes | Yes |
| `primitiv update` | Update commands & config | No | No | Progress only |

Both `install` and `init` run the same wizard. The only difference is `install` does `npm install -g primitiv` first. For CI/scripts, `primitiv init --yes` skips the interactive prompts.

The wizard flow:

1. **Welcome screen** — ASCII banner (gradient-colored block characters) + "Welcome to Primitiv" + version
2. **Git repo check** — If not in a git repo, prompt: "No git repo found. Initialize one?" (yes/no). If yes, run `git init`. If no, exit gracefully.
3. **Global install** (`install` only) — Run `npm install -g primitiv` with spinner. On permission failure, show: "Permission denied. Try: `sudo npx primitiv install`" and exit.
4. **Mode selection** — Interactive prompt: "What kind of project is this?"
   - **New project (greenfield)** — Starting from scratch
   - **Existing project (brownfield)** — Adding Primitiv to an existing codebase
3. **Stack detection** (brownfield only) — Animated scan with spinner, showing detected technologies as they're found
6. **Confirmation** — Summary of what will be created, with a confirm/cancel prompt
7. **Installation** — Animated progress for each setup step (directory creation, command installation, MCP config, codebase indexing)
8. **Success screen** — Completion banner with next steps, styled as a boxed panel

The wizard must support non-interactive mode for CI/scripts via `--yes` flag (skips prompts, uses defaults) and the existing `--greenfield`/`--brownfield` flags remain functional for backward compatibility.

### 3. Animated Updater

Enhance `primitiv update` with:

1. **Version check** — Compare installed version against npm registry, show current vs latest
2. **Change detection** — Diff the installed slash commands against templates, show which commands have changes
3. **Progress animation** — Spinner/progress bar for each update step
4. **Summary** — Boxed panel showing: commands updated, commands added, commands unchanged, MCP config status

### 4. Shared UI Components

Create a reusable terminal UI module (`src/ui/`) with:

- **Banner renderer** — ASCII art with optional gradient/color
- **Spinner** — Animated spinner for async operations
- **Prompt** — Interactive menu selection (single-select, confirm)
- **Progress** — Step-by-step progress indicator with checkmarks
- **Box** — Bordered panel for summaries and success screens
- **Transition animations** — Subtle line-clearing and reveal effects

### 5. New Dependencies

Add terminal UI libraries:

- **`@clack/prompts`** — Beautiful, minimal CLI prompts (menu select, confirm, spinner). Small footprint, widely adopted, MIT license. Preferred over `inquirer` for its cleaner API and built-in visual style.
- **`gradient-string`** — Terminal gradient colors for the ASCII banner
- No `figlet` — hand-craft the ASCII art for a bespoke look instead of generated fonts

## Acceptance Criteria

### Feature: npm Publishing

The package is published to npm and usable via npx without cloning or global install.

#### Scenario: Package is usable via npx
  Given the package `primitiv` is published to npm
  When a user runs `npx primitiv install` in any git repository
  Then the package downloads, installs `primitiv` globally, and runs the wizard
  And no prior installation or cloning is required

#### Scenario: After install, primitiv is available globally
  Given the user has run `npx primitiv install`
  When the install completes
  Then running `primitiv --version` in any terminal works without `npx`
  And `primitiv init`, `primitiv update`, `primitiv status` etc. are all available directly

#### Scenario: Package builds cleanly
  Given the source code has no TypeScript errors
  When `npm run build` executes
  Then `tsc` completes with zero errors
  And `dist/` contains all compiled JavaScript and type declarations

#### Scenario: Package metadata is complete
  Given the `package.json` is published
  Then the `name` field is `primitiv`
  And `license` is `MIT`
  And `repository` points to the GitHub repo
  And `keywords` include relevant terms for discoverability
  And `engines` specifies `node >= 18`
  And `files` includes `dist/` and `templates/`

### Feature: CI/CD Pipeline

Automated build, test, and publish via GitHub Actions.

#### Scenario: CI runs on every push and PR
  Given a developer pushes code or opens a PR to `main`
  When the CI workflow triggers
  Then it installs dependencies
  And runs TypeScript type checking (`tsc --noEmit`)
  And runs the full test suite (`vitest run`)
  And the workflow fails if any step fails

#### Scenario: Publish to npm on GitHub Release
  Given a maintainer creates a GitHub Release with a version tag
  When the publish workflow triggers
  Then it builds the project
  And publishes the package to npm using the `NPM_TOKEN` secret
  And the npm version matches the release tag

#### Scenario: CI blocks broken PRs
  Given a PR introduces a TypeScript error or a failing test
  When the CI workflow runs
  Then the workflow reports failure
  And the PR cannot be merged (when branch protection is enabled)

### Feature: ASCII Art Banner

The Primitiv CLI displays a distinctive branded banner on startup.

#### Scenario: Install displays full ASCII banner
  Given the user runs `npx primitiv install` in a git repository
  When the install wizard starts
  Then an ASCII art Primitiv logo is displayed
  And the current version number is shown below the logo
  And a tagline is displayed

#### Scenario: Update displays compact banner
  Given the user runs `primitiv update` in an initialized project
  When the update process starts
  Then a compact single-line Primitiv header is displayed with version

### Feature: Install Command (Global Install + Wizard)

The `install` command installs Primitiv globally and runs the interactive project init wizard.

#### Scenario: Git repo pre-check offers to initialize
  Given the user runs `npx primitiv install` in a directory without a git repo
  When the wizard starts
  Then it prompts "No git repo found. Initialize one?"
  And if the user confirms, `git init` runs and the wizard continues
  And if the user declines, the wizard exits gracefully

#### Scenario: Global installation
  Given the user runs `npx primitiv install` in a git repository
  When the install command starts
  Then it runs `npm install -g primitiv` to install the CLI globally
  And a spinner shows during the global install
  And a success message confirms `primitiv` is now available globally

#### Scenario: Global install permission failure
  Given the user runs `npx primitiv install` without sufficient permissions
  When `npm install -g` fails with a permission error
  Then a clear message is shown: "Permission denied. Try: sudo npx primitiv install"
  And the wizard exits without partial state

#### Scenario: Interactive mode selection
  Given the global install has completed
  And the current directory is a git repository
  And the project is not already initialized
  When the welcome screen appears
  Then the user sees an interactive menu to choose between "New project" and "Existing project"
  And arrow keys navigate between options
  And Enter confirms the selection

#### Scenario: Brownfield stack detection with animation
  Given the user selects "Existing project" in the init wizard
  When the stack detection phase begins
  Then a spinner animation is displayed during detection
  And detected technologies appear as they are found
  And the final detected stack is summarized

#### Scenario: Confirmation before installation
  Given the user has selected a mode and stack detection is complete
  When the confirmation prompt appears
  Then a summary of what will be created is displayed
  And the user can confirm or cancel
  And cancelling exits without creating any files

#### Scenario: Animated installation progress
  Given the user confirms the installation
  When each setup step executes
  Then a spinner or progress indicator shows the current step
  And each completed step shows a green checkmark
  And the final success screen displays a boxed panel with next steps

#### Scenario: Already initialized project
  Given the user runs `npx primitiv install` in a project with `.primitiv/` directory
  When initialization is checked
  Then a styled warning message is shown
  And the user is advised to run `primitiv update` instead

### Feature: Init Command (Interactive Wizard)

The `init` command runs the same interactive wizard as `install` — ASCII art, greenfield/brownfield menu, animations — but without the global install step.

#### Scenario: Init shows ASCII banner and interactive menu
  Given the user runs `primitiv init` in a git repository
  And the project is not already initialized
  When the init wizard starts
  Then the ASCII art Primitiv logo is displayed
  And the user sees an interactive menu to choose between "New project (greenfield)" and "Existing project (brownfield)"
  And arrow keys navigate between options
  And Enter confirms the selection

#### Scenario: Init with greenfield flag skips menu
  Given the user runs `primitiv init --greenfield`
  When the command executes
  Then the mode selection menu is skipped
  And greenfield initialization runs with ASCII banner and animated progress
  And the success screen is displayed

#### Scenario: Init with brownfield flag skips menu
  Given the user runs `primitiv init --brownfield`
  When the command executes
  Then the mode selection menu is skipped
  And brownfield initialization runs with stack detection and animated progress
  And the success screen is displayed

#### Scenario: Non-interactive mode with --yes flag
  Given the user runs `primitiv init --yes`
  When the command executes
  Then no interactive prompts are shown
  And no ASCII art banner is displayed
  And the default mode (brownfield) is used
  And installation proceeds with minimal progress output (for CI/scripts)

### Feature: Animated Updater

The update command shows what changed with progress animations.

#### Scenario: Update with changed commands
  Given the user runs `primitiv update` in an initialized project
  And some slash commands have newer versions in the templates
  When the update runs
  Then a spinner shows during command comparison
  And a summary shows the count of updated, added, and unchanged commands
  And each updated command is listed by name

#### Scenario: Update when everything is current
  Given the user runs `primitiv update` in an initialized project
  And all slash commands match the templates
  When the update runs
  Then the summary shows "All commands up to date"
  And no unnecessary file writes occur

#### Scenario: Update displays version info
  Given the user runs `primitiv update`
  When the update starts
  Then the current installed version is displayed

### Feature: Shared UI Components

Reusable terminal UI primitives for consistent visual style across all CLI commands.

#### Scenario: Spinner renders during async operations
  Given any CLI command needs to show an in-progress operation
  When the spinner is started with a message
  Then an animated spinner character cycles on the terminal
  And the message is displayed next to the spinner
  And the spinner stops with a success or failure icon when done

#### Scenario: Box renders summary panels
  Given a CLI command needs to display a summary or success message
  When the box renderer is called with title and content
  Then a bordered panel is displayed in the terminal
  And the content is properly padded and aligned

## Test Strategy

- **Unit tests**: Banner rendering, box rendering, version comparison logic, command diff detection
- **Integration tests**: Full init wizard flow (mocked prompts), full update flow, non-interactive mode
- **Snapshot tests**: ASCII art banner output, box panel output (terminal string snapshots)

## Constraints

- **TypeScript must compile** — The existing `GovernanceCompiler.ts` type errors must be fixed before publish. `tsc` must exit 0.
- **No `figlet`** — ASCII art is hand-crafted, not generated from a font renderer. Bespoke look, smaller dependency.
- **`@clack/prompts`** is the prompt library — not `inquirer`, not `prompts`. Single, modern dependency for all interactive elements.
- **Non-interactive fallback** — `--yes` flag and existing flags (`--greenfield`, `--brownfield`) must work in CI/script contexts. The wizard is an enhancement, not a hard requirement for operation.
- **No breaking changes** — The existing `primitiv init --greenfield` and `primitiv init --brownfield` behavior must continue to work.
- **Terminal compatibility** — Must degrade gracefully on terminals without color support (respects `NO_COLOR` env var).
- **Minimal new dependencies** — Only `@clack/prompts` and `gradient-string`. No heavy UI frameworks.
- **Performance** — Init should feel instant. No artificial delays for animations — spinners are real wait indicators, not decoration.

## Out of Scope

- **Self-update mechanism** — Auto-updating the `primitiv` npm package itself (users run `npm update -g`)
- **Remote version checking** — Checking npm registry for newer versions (future enhancement)
- **Theming/customization** — User-configurable color schemes or ASCII art variants
- **Windows-specific terminal handling** — Basic compatibility via chalk's auto-detection, but no Windows Terminal-specific features
- **Plugin marketplace UI** — Future enhancement for plugin discovery/install
- **Telemetry/analytics** — No usage tracking or opt-in analytics in the installer
