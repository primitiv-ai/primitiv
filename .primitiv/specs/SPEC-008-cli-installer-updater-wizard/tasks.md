---
type: tasks
version: 1
specId: SPEC-008
tasks:
  - id: TASK-001
    title: "Fix TypeScript build errors in GovernanceCompiler"
    description: "Fix 3 type errors in GovernanceCompiler.ts where AnyConstitutionFrontmatter union type isn't narrowed before assignment. Add explicit type assertions or narrow via the type discriminant field. Verify tsc exits 0 and all 207 tests pass."
    status: completed
    files:
      - "src/engine/GovernanceCompiler.ts"
    acceptanceCriteria:
      - "Feature: npm Publishing > Scenario: Package builds cleanly"
    dependsOn: []
  - id: TASK-002
    title: "Prepare package.json for npm publish and add LICENSE"
    description: "Rename package to primitiv (or primitiv-cli fallback), bump to 1.0.0, add license, repository, keywords, engines fields. Add @clack/prompts and gradient-string as dependencies. Run npm install. Create MIT LICENSE file."
    status: completed
    files:
      - "package.json"
      - "package-lock.json"
      - "LICENSE"
    acceptanceCriteria:
      - "Feature: npm Publishing > Scenario: Package metadata is complete"
    dependsOn: ["TASK-001"]
  - id: TASK-003
    title: "Create CI/CD GitHub Actions workflows"
    description: "Create .github/workflows/ci.yml (tsc + vitest on push/PR) and .github/workflows/publish.yml (npm publish on GitHub Release with NPM_TOKEN secret)."
    status: completed
    files:
      - ".github/workflows/ci.yml"
      - ".github/workflows/publish.yml"
    acceptanceCriteria:
      - "Feature: CI/CD Pipeline > Scenario: CI runs on every push and PR"
      - "Feature: CI/CD Pipeline > Scenario: Publish to npm on GitHub Release"
      - "Feature: CI/CD Pipeline > Scenario: CI blocks broken PRs"
    dependsOn: []
  - id: TASK-004
    title: "Create src/ui/ module with banner and box renderer"
    description: "Create src/ui/banner.ts with renderBanner() (gradient ASCII art) and renderCompactBanner() (single-line header). Create src/ui/box.ts with renderBox() for bordered panels. Create src/ui/index.ts re-exporting all. Respect NO_COLOR env var. Create tests/ui.test.ts with unit tests."
    status: completed
    files:
      - "src/ui/banner.ts"
      - "src/ui/box.ts"
      - "src/ui/index.ts"
      - "tests/ui.test.ts"
    acceptanceCriteria:
      - "Feature: ASCII Art Banner > Scenario: Install displays full ASCII banner"
      - "Feature: ASCII Art Banner > Scenario: Update displays compact banner"
      - "Feature: Shared UI Components > Scenario: Spinner renders during async operations"
      - "Feature: Shared UI Components > Scenario: Box renders summary panels"
    dependsOn: ["TASK-002"]
  - id: TASK-005
    title: "Rewrite init command as interactive wizard"
    description: "Rewrite src/commands/init.ts with 3 modes: (1) Interactive (default) — banner, git check with offer to git init, mode selection via @clack/prompts, stack detection with spinner, confirmation, animated progress, success box. (2) Flag mode (--greenfield/--brownfield) — skip mode selection, show banner + progress. (3) Non-interactive (--yes) — no prompts, no banner, minimal output. Update src/cli.ts to add --yes flag. Core logic still delegates to initGreenfield()/initBrownfield(). Create tests/init-wizard.test.ts."
    status: completed
    files:
      - "src/commands/init.ts"
      - "src/cli.ts"
      - "tests/init-wizard.test.ts"
    acceptanceCriteria:
      - "Feature: Init Command > Scenario: Init shows ASCII banner and interactive menu"
      - "Feature: Init Command > Scenario: Init with greenfield flag skips menu"
      - "Feature: Init Command > Scenario: Init with brownfield flag skips menu"
      - "Feature: Init Command > Scenario: Non-interactive mode with --yes flag"
    dependsOn: ["TASK-004"]
  - id: TASK-006
    title: "Create install command with global install + wizard"
    description: "Create src/commands/install.ts that: (1) shows banner, (2) checks git repo — offers git init via @clack/prompts if missing, (3) runs npm install -g primitiv with spinner — catches permission errors with helpful message, (4) delegates to the init wizard flow. Register in src/cli.ts. Create tests/install.test.ts with mocked child_process."
    status: completed
    files:
      - "src/commands/install.ts"
      - "src/cli.ts"
      - "tests/install.test.ts"
    acceptanceCriteria:
      - "Feature: Install Command > Scenario: Git repo pre-check offers to initialize"
      - "Feature: Install Command > Scenario: Global installation"
      - "Feature: Install Command > Scenario: Global install permission failure"
      - "Feature: Install Command > Scenario: Interactive mode selection"
      - "Feature: Install Command > Scenario: Brownfield stack detection with animation"
      - "Feature: Install Command > Scenario: Confirmation before installation"
      - "Feature: Install Command > Scenario: Animated installation progress"
      - "Feature: Install Command > Scenario: Already initialized project"
      - "Feature: npm Publishing > Scenario: Package is usable via npx"
      - "Feature: npm Publishing > Scenario: After install, primitiv is available globally"
    dependsOn: ["TASK-005"]
  - id: TASK-007
    title: "Enhance update command with diff detection and progress"
    description: "Rewrite src/commands/update.ts to: (1) show compact banner, (2) read current .claude/commands/ content and compare against templates — categorize as updated/added/unchanged, (3) skip writes for unchanged commands, (4) show spinner during update, (5) display summary box with counts and changed command names. Create tests/update-enhanced.test.ts."
    status: completed
    files:
      - "src/commands/update.ts"
      - "tests/update-enhanced.test.ts"
    acceptanceCriteria:
      - "Feature: Animated Updater > Scenario: Update with changed commands"
      - "Feature: Animated Updater > Scenario: Update when everything is current"
      - "Feature: Animated Updater > Scenario: Update displays version info"
    dependsOn: ["TASK-004"]
  - id: TASK-008
    title: "Update architecture log"
    description: "Append per-spec tech stack entry to .primitiv/constitutions/architecture.md for SPEC-008."
    status: completed
    files:
      - ".primitiv/constitutions/architecture.md"
    acceptanceCriteria: []
    dependsOn: ["TASK-007"]
updatedAt: "2026-04-06T15:15:00.000Z"
---

# Tasks — SPEC-008: CLI Installer & Updater Wizard

## TASK-001: Fix TypeScript build errors in GovernanceCompiler

**Status:** pending
**Files:** `src/engine/GovernanceCompiler.ts`
**Depends on:** none

Fix 3 type errors where `AnyConstitutionFrontmatter` union type isn't narrowed before assignment to specific constitution types (`DevConstitutionFrontmatter`, `ProductConstitutionFrontmatter`, `ArchConstitutionFrontmatter`). Add explicit type assertions after `tryLoadSection()` calls since the section name already determines the type. Verify `tsc --noEmit` exits 0 and all 207 tests pass.

**Acceptance Criteria:**
- Feature: npm Publishing > Scenario: Package builds cleanly

---

## TASK-002: Prepare package.json for npm publish and add LICENSE

**Status:** pending
**Files:** `package.json`, `package-lock.json`, `LICENSE`
**Depends on:** TASK-001

- Rename `name` from `primitiv-spec-engine` to `primitiv` (check npm availability first; fallback: `primitiv-cli`)
- Bump `version` from `0.2.0` to `1.0.0`
- Add `"license": "MIT"`
- Add `"repository": { "type": "git", "url": "https://github.com/primitiv-ai/primitiv-spec-engine" }`
- Add `"keywords": ["cli", "spec-driven-development", "ai", "specification", "bdd", "developer-tools"]`
- Add `"engines": { "node": ">=18" }`
- Add `@clack/prompts` and `gradient-string` to dependencies
- Run `npm install` to update `package-lock.json`
- Create `LICENSE` file with standard MIT text

**Acceptance Criteria:**
- Feature: npm Publishing > Scenario: Package metadata is complete

---

## TASK-003: Create CI/CD GitHub Actions workflows

**Status:** pending
**Files:** `.github/workflows/ci.yml`, `.github/workflows/publish.yml`
**Depends on:** none

**ci.yml:** Triggers on push and PR to main. Steps: checkout, setup-node (20), npm ci, tsc --noEmit, vitest run.

**publish.yml:** Triggers on GitHub Release (published). Steps: checkout, setup-node with npm registry, npm ci, npm run build, npm publish with NPM_TOKEN secret.

**Acceptance Criteria:**
- Feature: CI/CD Pipeline > Scenario: CI runs on every push and PR
- Feature: CI/CD Pipeline > Scenario: Publish to npm on GitHub Release
- Feature: CI/CD Pipeline > Scenario: CI blocks broken PRs

---

## TASK-004: Create src/ui/ module with banner and box renderer

**Status:** pending
**Files:** `src/ui/banner.ts`, `src/ui/box.ts`, `src/ui/index.ts`, `tests/ui.test.ts`
**Depends on:** TASK-002

**banner.ts:**
- `renderBanner()` — hand-crafted block-character ASCII art with `gradient-string` applied. Returns the full banner string including version and tagline.
- `renderCompactBanner()` — single-line `"◆ Primitiv v1.0.0"` for update command.
- Respects `NO_COLOR` env var — falls back to plain uncolored text.

**box.ts:**
- `renderBox({ title?, content, padding? })` — bordered panel using Unicode box-drawing characters (┌─┐│└─┘). Used for success screens and summaries.

**index.ts:** Re-export all functions.

**tests/ui.test.ts:** Banner contains "PRIMITIV", compact banner contains version, box renders borders, NO_COLOR produces uncolored output.

**Acceptance Criteria:**
- Feature: ASCII Art Banner > Scenario: Install displays full ASCII banner
- Feature: ASCII Art Banner > Scenario: Update displays compact banner
- Feature: Shared UI Components > Scenario: Spinner renders during async operations
- Feature: Shared UI Components > Scenario: Box renders summary panels

---

## TASK-005: Rewrite init command as interactive wizard

**Status:** pending
**Files:** `src/commands/init.ts`, `src/cli.ts`, `tests/init-wizard.test.ts`
**Depends on:** TASK-004

Rewrite `runInit()` with three modes:

**Interactive (default):**
1. `renderBanner()`
2. Git repo check — if missing, `@clack/prompts` confirm to offer `git init`
3. Already-initialized check — styled warning + suggest `primitiv update`
4. Mode selection — `@clack/prompts` select: "New project (greenfield)" / "Existing project (brownfield)"
5. Stack detection (brownfield) — `@clack/prompts` spinner during detection, list detected tech
6. Confirmation — `@clack/prompts` confirm with summary
7. Run `initGreenfield()`/`initBrownfield()` with `@clack/prompts` spinner per step
8. Success box with next steps

**Flag mode (--greenfield / --brownfield):** Skip step 4, show banner + animated progress.

**Non-interactive (--yes):** No prompts, no banner, minimal chalk output (preserves CI behavior).

Update `src/cli.ts` to add `--yes` flag to init command.

**Acceptance Criteria:**
- Feature: Init Command > Scenario: Init shows ASCII banner and interactive menu
- Feature: Init Command > Scenario: Init with greenfield flag skips menu
- Feature: Init Command > Scenario: Init with brownfield flag skips menu
- Feature: Init Command > Scenario: Non-interactive mode with --yes flag

---

## TASK-006: Create install command with global install + wizard

**Status:** pending
**Files:** `src/commands/install.ts`, `src/cli.ts`, `tests/install.test.ts`
**Depends on:** TASK-005

Create `runInstall()`:
1. `renderBanner()`
2. Git repo check — offer `git init` if missing
3. Already-initialized check — styled warning + suggest `primitiv update`
4. Global install — spawn `npm install -g primitiv` via `child_process.execSync`. Show `@clack/prompts` spinner. On EACCES/permission error, show: "Permission denied. Try: sudo npx primitiv install" and exit.
5. Delegate to the shared wizard flow from init (steps 4-8)

Register in `src/cli.ts`.

Tests mock `child_process.execSync` for global install, test permission failure path, test git init offer.

**Acceptance Criteria:**
- Feature: Install Command > Scenario: Git repo pre-check offers to initialize
- Feature: Install Command > Scenario: Global installation
- Feature: Install Command > Scenario: Global install permission failure
- Feature: Install Command > Scenario: Interactive mode selection
- Feature: Install Command > Scenario: Brownfield stack detection with animation
- Feature: Install Command > Scenario: Confirmation before installation
- Feature: Install Command > Scenario: Animated installation progress
- Feature: Install Command > Scenario: Already initialized project
- Feature: npm Publishing > Scenario: Package is usable via npx
- Feature: npm Publishing > Scenario: After install, primitiv is available globally

---

## TASK-007: Enhance update command with diff detection and progress

**Status:** pending
**Files:** `src/commands/update.ts`, `tests/update-enhanced.test.ts`
**Depends on:** TASK-004

Rewrite `runUpdate()`:
1. `renderCompactBanner()`
2. Assert git repo + initialized (existing checks)
3. Read current `.claude/commands/` files, compare content against templates via `loadTemplate()`
4. Categorize each command: `updated` (content differs), `added` (template exists but no current file), `unchanged`
5. Only write files that changed or are new (skip unchanged)
6. Run `installGitNexusMcp()` with `@clack/prompts` spinner
7. Display summary box: "X updated, Y added, Z unchanged" + list of changed command names

Tests: diff detection with mock file system, unchanged skipping, summary output.

**Acceptance Criteria:**
- Feature: Animated Updater > Scenario: Update with changed commands
- Feature: Animated Updater > Scenario: Update when everything is current
- Feature: Animated Updater > Scenario: Update displays version info

---

## TASK-008: Update architecture log

**Status:** pending
**Files:** `.primitiv/constitutions/architecture.md`
**Depends on:** TASK-007

Append: `- @clack/prompts + gradient-string added; new src/ui/ module, install command, CI/CD workflows; GovernanceCompiler TS fix; package renamed + v1.0.0 (SPEC-008)`

**Acceptance Criteria:** (architecture log convention)
