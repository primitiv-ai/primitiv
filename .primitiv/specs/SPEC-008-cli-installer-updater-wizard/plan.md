---
type: plan
version: 1
specId: SPEC-008
approach: "Fix TS build errors, prepare package.json for npm publish (rename, v1.0.0, metadata), add CI/CD GitHub Actions, create src/ui/ module with banner/spinner/box/prompts, rewrite init command as interactive wizard, add install command with global install, enhance update with diff detection, add gradient-string and @clack/prompts deps"
fileChanges:
  - path: "src/engine/GovernanceCompiler.ts"
    action: modify
    description: "Fix 3 TypeScript type errors — add explicit type narrowing for constitution union types in compile() and deriveConstraints() — Feature: npm Publishing > Scenario: Package builds cleanly"
  - path: "package.json"
    action: modify
    description: "Rename to primitiv (or primitiv-cli), bump to 1.0.0, add license/repository/keywords/engines, add @clack/prompts and gradient-string deps — Feature: npm Publishing > Scenario: Package metadata is complete"
  - path: "package-lock.json"
    action: modify
    description: "Auto-updated by npm install after adding new dependencies"
  - path: ".github/workflows/ci.yml"
    action: create
    description: "CI workflow: install, tsc --noEmit, vitest run on push/PR to main — Feature: CI/CD Pipeline > Scenario: CI runs on every push and PR"
  - path: ".github/workflows/publish.yml"
    action: create
    description: "Publish workflow: build + npm publish on GitHub Release — Feature: CI/CD Pipeline > Scenario: Publish to npm on GitHub Release"
  - path: "src/ui/banner.ts"
    action: create
    description: "ASCII art banner with gradient-string rendering, version display, tagline — Feature: ASCII Art Banner > Scenario: Install displays full ASCII banner"
  - path: "src/ui/box.ts"
    action: create
    description: "Bordered box renderer for summary panels and success screens — Feature: Shared UI Components > Scenario: Box renders summary panels"
  - path: "src/ui/index.ts"
    action: create
    description: "Re-export all UI components from src/ui/"
  - path: "src/commands/install.ts"
    action: create
    description: "New install command: global npm install + wizard flow — Feature: Install Command > Scenario: Global installation"
  - path: "src/commands/init.ts"
    action: modify
    description: "Rewrite as interactive wizard with banner, git check, mode selection, animated progress, success screen — Feature: Init Command > Scenario: Init shows ASCII banner and interactive menu"
  - path: "src/commands/update.ts"
    action: modify
    description: "Add command diff detection, compact banner, spinner, summary box — Feature: Animated Updater > Scenario: Update with changed commands"
  - path: "src/cli.ts"
    action: modify
    description: "Register new install command, add --yes flag to init — Feature: Install Command + Feature: Init Command"
  - path: "tests/ui.test.ts"
    action: create
    description: "Unit tests for banner rendering, box rendering — Feature: Shared UI Components"
  - path: "tests/install.test.ts"
    action: create
    description: "Tests for install command: global install flow, permission failure handling — Feature: Install Command"
  - path: "tests/init-wizard.test.ts"
    action: create
    description: "Tests for init wizard: interactive mode, flag modes, --yes mode, already initialized — Feature: Init Command"
  - path: "tests/update-enhanced.test.ts"
    action: create
    description: "Tests for enhanced update: diff detection, unchanged commands, version display — Feature: Animated Updater"
  - path: "LICENSE"
    action: create
    description: "MIT license file — Feature: npm Publishing > Scenario: Package metadata is complete"
  - path: ".primitiv/constitutions/architecture.md"
    action: modify
    description: "Append per-spec tech stack entry for SPEC-008"
risks:
  - "npm name `primitiv` may be taken — fallback is `primitiv-cli` (clarified)"
  - "GovernanceCompiler TS fix may affect runtime behavior if type narrowing changes logic (mitigate: run full test suite after fix)"
  - "@clack/prompts is ESM-only — must ensure compatibility with the project's ESM setup (type: module in package.json, should be fine)"
  - "Global npm install in the install command spawns a child process — testing requires mocking execSync/spawn"
  - "First npm publish is manual (needs npm login + npm publish) — CI handles subsequent releases"
dependencies:
  - "npm account with publish access to claim the package name (manual, one-time)"
  - "GitHub repo secret NPM_TOKEN (manual, one-time setup by repo owner)"
codebaseAnalysis:
  existingCode:
    - "src/commands/init.ts (54 lines) — current non-interactive init, calls initGreenfield/initBrownfield"
    - "src/commands/update.ts (21 lines) — current update, calls installSlashCommands/installGitNexusMcp"
    - "src/init/greenfield.ts — creates .primitiv/ structure, returns { commands }"
    - "src/init/brownfield.ts — creates .primitiv/ structure + stack detection, returns { commands, detectedStack }"
    - "src/init/installCommands.ts — copies templates to .claude/commands/, always overwrites all"
    - "src/init/installGitNexus.ts — writes/updates .mcp.json"
    - "src/cli.ts — commander setup with 6 commands (init, validate, status, update, compile, migrate)"
    - "src/engine/GovernanceCompiler.ts — has 3 TS errors blocking tsc (union type narrowing issue)"
    - "package.json — name: primitiv-spec-engine, version: 0.2.0, missing license/repository/keywords/engines"
  reusableModules:
    - "src/init/greenfield.ts and src/init/brownfield.ts — core init logic stays, wizard wraps around it"
    - "src/init/installCommands.ts — reuse for both init wizard and update diff detection"
    - "src/init/installGitNexus.ts — reuse as-is"
    - "src/git/gitGuard.ts — assertGitRepo for git detection (enhance, don't replace)"
    - "chalk — already a dependency, continue using for non-gradient text"
  patternsToFollow:
    - "Commander for CLI command registration (src/cli.ts pattern)"
    - "Async command handlers exported as named functions (runInit, runUpdate pattern)"
    - "Template loading via src/init/templates.ts"
    - "Error classes from src/utils/errors.ts"
    - "Test pattern: describe/it blocks in tests/ directory with Vitest"
updatedAt: "2026-04-06T15:00:00.000Z"
---

# Plan — SPEC-008: CLI Installer & Updater Wizard

## Approach

This spec has 5 layers, built bottom-up:

1. **Fix & Publish** — Fix TS build errors, complete package.json, add LICENSE, publish to npm
2. **CI/CD** — GitHub Actions for CI (test on PR) and publish (npm on release)
3. **UI Module** — `src/ui/` with banner, box renderer (shared by all commands)
4. **Wizard** — Rewrite `init` as interactive wizard, add `install` command wrapping it
5. **Updater** — Enhance `update` with diff detection and progress

## Codebase Analysis

### What Already Exists

The init/update infrastructure is solid — `initGreenfield()`, `initBrownfield()`, `installSlashCommands()`, `installGitNexusMcp()` all work and are well-tested. The wizard doesn't replace this logic; it wraps it with UI.

The TS build is broken by 3 type errors in `GovernanceCompiler.ts` (lines 75, 83-85) where `AnyConstitutionFrontmatter` union type isn't narrowed before assignment to specific constitution types. Fix: add explicit type assertions or narrow via the `type` discriminant field.

`package.json` is missing `license`, `repository`, `keywords`, and `engines`. Version is `0.2.0`. Name is `primitiv-spec-engine`.

### What to Reuse

- `initGreenfield()` / `initBrownfield()` — called inside the wizard after mode selection
- `installSlashCommands()` — called by both wizard and update. For update diff, compare before/after.
- `assertGitRepo()` — use for detection, but don't throw in wizard mode (offer to git init instead)
- `chalk` — continue using for non-gradient colored text
- Commander — continue using for CLI registration

### What to Build from Scratch

- `src/ui/banner.ts` — ASCII art + gradient rendering
- `src/ui/box.ts` — bordered panel renderer
- `src/commands/install.ts` — new command (global install + wizard)
- Rewrite of `src/commands/init.ts` — interactive wizard mode
- Enhancement of `src/commands/update.ts` — diff detection, progress
- `.github/workflows/ci.yml` and `publish.yml`
- `LICENSE` (MIT)
- 4 new test files

## Detailed File Changes

### Layer 1: Fix & Publish

**`src/engine/GovernanceCompiler.ts`** — Fix the 3 TS errors. The `tryLoadSection()` returns `AnyConstitutionFrontmatter | undefined` but the variables `development`, `product`, `architecture` need to be their specific types. Fix by using the discriminated union's `type` field to narrow, or by adding type assertions after the `tryLoadSection` calls since the section name already determines the type.

**`package.json`** — Major updates:
```json
{
  "name": "primitiv",          // was primitiv-spec-engine
  "version": "1.0.0",          // was 0.2.0
  "license": "MIT",            // new
  "repository": {              // new
    "type": "git",
    "url": "https://github.com/primitiv-ai/primitiv-spec-engine"
  },
  "keywords": ["cli", "spec-driven-development", "ai", "specification", "bdd", "developer-tools"],
  "engines": { "node": ">=18" },
  "dependencies": {
    "@clack/prompts": "^0.9",     // new
    "gradient-string": "^3.0"     // new
  }
}
```

**`LICENSE`** — Standard MIT license file.

### Layer 2: CI/CD

**`.github/workflows/ci.yml`**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx vitest run
```

**`.github/workflows/publish.yml`**:
```yaml
name: Publish
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Layer 3: UI Module

**`src/ui/banner.ts`**:
- `renderBanner()` — returns the full ASCII art string with gradient applied via `gradient-string`
- `renderCompactBanner()` — single-line "◆ Primitiv v1.0.0" for update command
- Uses hand-crafted block character ASCII art (not figlet)
- Respects `NO_COLOR` env var (falls back to plain text)

**`src/ui/box.ts`**:
- `renderBox({ title, content, padding })` — renders a bordered panel using Unicode box-drawing characters
- Used for success screens and summary panels

**`src/ui/index.ts`** — re-exports `renderBanner`, `renderCompactBanner`, `renderBox`

### Layer 4: Wizard (install + init)

**`src/commands/install.ts`** — New command:
1. Call `renderBanner()`
2. Check git repo — if missing, use `@clack/prompts` confirm to offer `git init`
3. Spawn `npm install -g primitiv` via `child_process.execSync`. Catch errors → show permission guidance.
4. Delegate to the shared wizard flow (same as init)

**`src/commands/init.ts`** — Rewritten:
- **Interactive mode** (default): banner → git check → mode selection via `@clack/prompts` select → stack detection with `@clack/prompts` spinner → confirmation → animated progress → success box
- **Flag mode** (`--greenfield`/`--brownfield`): skip mode selection, still show banner and progress
- **Non-interactive** (`--yes`): no prompts, no banner, minimal output (existing behavior preserved)
- Core logic still delegates to `initGreenfield()`/`initBrownfield()`

**`src/cli.ts`** — Register `install` command, add `--yes` flag to `init`.

### Layer 5: Enhanced Updater

**`src/commands/update.ts`** — Enhanced:
1. Show compact banner via `renderCompactBanner()`
2. Read current slash commands from `.claude/commands/`, compare content against templates
3. Categorize: `updated` (content differs), `added` (new template), `unchanged`
4. Run `installSlashCommands()` and `installGitNexusMcp()` with `@clack/prompts` spinner
5. Show summary box with counts and list of changed command names

### Tests

- **`tests/ui.test.ts`** — Banner contains "PRIMITIV", box renders borders, NO_COLOR fallback
- **`tests/install.test.ts`** — Global install child process mock, permission error handling, git init prompt
- **`tests/init-wizard.test.ts`** — Interactive mode (mock @clack/prompts), --greenfield flag, --yes mode, already-initialized guard
- **`tests/update-enhanced.test.ts`** — Diff detection (changed/unchanged/added), summary output

## Architecture

New `src/ui/` module sits alongside existing `src/commands/`, `src/engine/`, `src/init/`:

```
src/
  ui/                    ← NEW: shared terminal UI components
    banner.ts
    box.ts
    index.ts
  commands/
    install.ts           ← NEW: global install + wizard
    init.ts              ← REWRITTEN: interactive wizard
    update.ts            ← ENHANCED: diff detection + progress
    ...existing commands unchanged...
  init/                  ← UNCHANGED: core init logic
  engine/                ← FIX: GovernanceCompiler TS errors
  ...
.github/workflows/       ← NEW: CI/CD pipelines
  ci.yml
  publish.yml
```

The wizard commands (`install`, `init`) are thin UI wrappers around the existing init logic in `src/init/`. No init logic is duplicated.

## Risks

1. **npm name availability** — `primitiv` may be taken. Fallback: `primitiv-cli`. Check before implementation.
2. **GovernanceCompiler fix** — Type narrowing change could affect runtime. Mitigate: full test suite after fix (207 tests).
3. **@clack/prompts ESM** — ESM-only package. Project is already `"type": "module"` so should be compatible.
4. **Child process mocking** — `install` command spawns `npm install -g`. Tests must mock `child_process.execSync`.
5. **First publish is manual** — CI handles subsequent releases, but v1.0.0 requires `npm login` + `npm publish` locally.

## Dependencies

- **Manual one-time**: npm account with publish rights, `NPM_TOKEN` GitHub secret
- **New npm packages**: `@clack/prompts` (^0.9), `gradient-string` (^3.0)
- **No infrastructure changes**: No databases, no servers, no Docker changes
