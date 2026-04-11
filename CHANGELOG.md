# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.6] - 2026-04-11

### Added

- **Web Spec Viewer** — new `primitiv view` command launches a read-only Next.js 16 web viewer for the current Primitiv project (SPEC-013)
  - Dashboard: spec counts by status, gate and constitution presence badges, parse-error surface
  - Specs list with sortable headers, client-side filter, and friendly empty state
  - Spec detail with dynamic tabs per artifact (spec / clarifications / plan / tasks / test results / research); Gherkin-aware markdown rendering highlights Feature/Scenario headings and Given/When/Then keywords
  - Tasks tab features a 4-column Kanban board and a React Flow dependency graph (dagre auto-layout); each task card or node opens a Jira-style detail modal via shadcn Dialog
  - Gates, constitutions, and learnings routes with collapsible metadata panels (native `<details>`, closed by default)
  - Graceful handling of malformed frontmatter: parse errors render as warning banners above the raw body, and malformed specs still appear in list views
  - Viewer ships as a prebuilt Next.js standalone bundle under `dist/viewer/` (~40MB); no build step on the user's machine, works fully offline
  - `primitiv view --port <n>` (default 3141, 127.0.0.1-only), `--no-open` to suppress browser launch, clear error on port-in-use or uninitialised project
  - Engine layer extended: `SpecManager.listWithErrors()` surfaces malformed specs instead of silently skipping them, `getSpecGraph()` gains `research` / `checklistFiles` / `dataModelFiles` fields
  - New `apps/viewer/` workspace with design tokens and UI primitives mirrored from primitiv-platform (M3 dark palette, Inter + Clash Display fonts, radix-ui umbrella, shadcn new-york components)
  - New runtime dependencies (viewer-only): `@xyflow/react`, `@dagrejs/dagre`, `radix-ui`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `gray-matter`, `lucide-react`, `chokidar`, `ws`; new dev dependencies: `@tailwindcss/typography`, `tw-animate-css`
  - Root package gains `open ^10` for browser launch and a `build:viewer` script wired into the publish pipeline

### Changed

- **Architecture constitution rewritten as v2** — now describes the Primitiv CLI (not the Platform), with 5 new ADRs: CLI-vs-Platform scoping, filesystem as source of truth, engine reuse seam between CLI and viewer, prebuilt standalone packaging, read-only/loopback-only viewer
- Publish pipeline (`esbuild.config.js`) now runs full `tsc` (not declaration-only) before bundling so `dist/src/**/*.js` exists for the viewer's `@cli/*` path alias, then builds the viewer and copies the standalone bundle into `dist/viewer/`

### Known limitations

- Live reload (chokidar + WebSocket) is stubbed: the custom Next.js server approach broke on Next.js 16 standalone due to webpack-lib resolution. The viewer uses Next.js's default standalone `server.js` and all routes are `force-dynamic`, so manual browser refresh picks up every filesystem change immediately. A follow-up spec will re-introduce live reload via a Server Sent Events Route Handler.
- Playwright E2E suite deferred: a manual end-to-end smoke test against the real `.primitiv/` tree confirmed the happy path (server spawn, HTTP 200, dashboard with 14 specs and correct gate/constitution badges, clean SIGTERM exit).

## [1.0.5]

### Changed

- **Renamed gate commands** — `/primitiv.gate-1` → `/primitiv.company-principles`, `/primitiv.gate-2` → `/primitiv.security-principles`
  - Self-documenting names replace opaque numbered identifiers
  - `primitiv upgrade` removes old gate-1/gate-2 files and installs new ones
  - `primitiv upgrade` regenerates `.primitiv/README.md` from template
  - Gate numbers dropped from specify output (`Company Principles: Passed` instead of `Gate 1 (Company Principles): Passed`)
  - All cross-references updated across templates, source files, README, and tests

### Added

- **Contract Generation in Plan Phase** — contracts (`api-contract.md`, `data-contract.md`) are generated during `/primitiv.plan` and injected as truth into `/primitiv.implement`
  - Contracts define exact API shapes, request/response types, and data models — deviation is a defect
  - `ContractManager` updated to support `.md` files alongside `.yaml`/`.yml`
  - New `ContractFrontmatterSchema` Zod schema for contract document validation
  - Plan frontmatter gains `contracts` field listing generated contracts
  - Implement command template injects full contract contents into every subagent prompt
  - Updated README with new features (compile, learn, migrate, upgrade, Gherkin BDD)

- **Per-Project Upgrade Command** — `primitiv upgrade` replaces `primitiv update` with full project upgrade capabilities
  - Syncs `.primitiv/` directory structure (creates missing directories like `learnings/` for older projects)
  - Migrates state file (adds missing fields like `nextLearningId`, `primitivVersion` with safe defaults)
  - Updates slash commands with change detection (reports updated/added/unchanged)
  - Updates MCP config (ensures GitNexus is present)
  - Version tracking: `primitivVersion` field in `.state.json`, set on init and upgrade
  - `getPackageVersion()` utility reads version from package.json at runtime (fixes hardcoded `--version`)
  - Reports version transition ("Upgrading from X → Y") or "Already up to date"
  - 10 new integration tests
- **Self-Learning Loop** — built-in mechanism for capturing, storing, and surfacing project-level learnings across the Primitiv pipeline
  - `LearningManager` engine class: create, list, search, delete, and findRelevant methods for learning records stored as markdown with YAML frontmatter in `.primitiv/learnings/`
  - `LearningFrontmatterSchema` Zod schema with types: `best-practice`, `error-resolution`, `convention`; sources: `user`, `gate-failure`, `test-failure`, `clarification`, `review`; free-form tags; severity levels
  - GovernanceCompiler integration: learnings compiled as flat `learnings[]` array in `GovernanceContext`, learnings directory included in source hash for cache invalidation, `COMPILER_VERSION` bumped to `"1.2"`
  - `primitiv learn` CLI command with subcommands: `add`, `list`, `search`, `remove`
  - `/primitiv.learn` slash command template for AI agents (record + review modes)
  - Pipeline integration: relevant learnings surfaced in `/primitiv.specify`, `/primitiv.plan`, `/primitiv.implement`, `/primitiv.test-feature` via tag matching
  - `ensurePrimitivDir` creates `.primitiv/learnings/` on init
  - `nextLearningId` added to state file (backwards compatible)
  - 66 new tests across 4 test files (schema validation, LearningManager CRUD, GovernanceCompiler integration, CLI commands, init integration)
- **CLI Installer & Updater Wizard** — premium first-run experience via `npx primitiv install`
  - `primitiv install` command: global npm install + interactive wizard with ASCII art banner, mode selection, animated progress
  - `primitiv init` rewritten as interactive wizard with @clack/prompts (greenfield/brownfield menu, stack detection spinner, success box)
  - `primitiv update` enhanced with command diff detection (updated/added/unchanged), compact banner, summary box
  - `src/ui/` module: gradient ASCII art banner (`renderBanner`), compact banner (`renderCompactBanner`), bordered box panels (`renderBox`)
  - Non-interactive mode (`--yes` flag) for CI/scripts
- **npm Publishing** — package renamed from `primitiv-spec-engine` to `primitiv`, version bumped to 1.0.0
  - MIT LICENSE file
  - Complete package.json metadata (repository, keywords, engines)
  - `npx primitiv install` works end-to-end without cloning
- **CI/CD Pipeline** — GitHub Actions workflows
  - `ci.yml`: TypeScript type check + Vitest on every push/PR to main
  - `publish.yml`: automatic npm publish on GitHub Release via NPM_TOKEN secret
- **TypeScript build fix** — GovernanceCompiler union type narrowing errors resolved, `tsc` exits 0
- New dependencies: `@clack/prompts`, `gradient-string`
- Mandatory Gherkin BDD syntax for acceptance criteria in `/primitiv.specify` — Feature/Scenario/Given/When/Then replaces freeform checkboxes
  - Concrete example in template: Scenario, Scenario Outline with Examples table, Background
  - Plain-English Feature descriptions replace "As a...I want to...so that..." user stories
- Gherkin-to-test mapping in `/primitiv.test-feature` — `describe(Feature) > describe(Scenario) > beforeEach(Given+When) > it(Then)` with `it.each` for Scenario Outlines
  - Backward compatibility: checkbox-format specs from SPEC-001–006 still work
  - Scenario-based coverage table in test-results.md
- Gherkin scenario references in `/primitiv.plan` file change descriptions
- Gherkin scenario references in `/primitiv.tasks` acceptanceCriteria field (`"Feature: X > Scenario: Y"` format)
- JSDoc on `TaskItemSchema.acceptanceCriteria` documenting the Gherkin reference format
- SPEC-005 spec for greenfield project bootstrap command (`/primitiv.bootstrap`) — archetype-aware, stack-agnostic scaffolding for the 0-to-1 journey
- GitNexus codebase exploration step in `/primitiv.specify` — queries existing code before writing specs so acceptance criteria are grounded in reality
- GitNexus re-indexing step in `/primitiv.compushpr` — refreshes the knowledge graph after squash merge so future specs have accurate data
- "Current Behavior", "Proposed Changes", and "Test Strategy" sections to spec document template
- Normalized Constraints Layer: `GovernanceContext` extended with `constraints: NormalizedConstraints` field derived mechanically from all governance sections
  - `NormalizedConstraint` objects carry `{ category, rule, source }` — verbatim rules from governance arrays, no LLM inference
  - Four categories: `tech` (dev stack), `code` (agent rules + code style), `architecture` (patterns + boundaries), `security` (policies + OWASP)
  - Constraints are deduplicated by rule string and deterministically sorted (category → rule alphabetically)
  - `COMPILER_VERSION` bumped `"1.0"` → `"1.1"` — all cached contexts auto-recompile on next `primitiv compile` or pre-flight
  - 8 new unit tests: full derivation, missing sections, all-absent, deduplication, ordering, source attribution, version bump staleness
- Governance Compilation Layer: `primitiv compile` CLI command and `GovernanceCompiler` engine class that aggregates all governance inputs (gates + constitutions) into a single typed, cached `GovernanceContext` JSON
  - Compiles YAML frontmatter from all 5 governance files into a deterministic, SHA-256-hashed `governance-context.json`
  - Staleness detection via version check and source-file hash comparison — auto-recompiles when governance files change
  - `.primitiv/.gitignore` management: compiled context is automatically gitignored on first write (derived artifact)
  - `ensureGovernanceContext()` pre-flight function for downstream pipeline commands
  - `GovernanceCompiler` exposed on `PrimitivEngine` facade and exported from SDK
  - `/primitiv.compile` slash command template
  - Schema fixes: `operatingPrinciples` added to `CompanyPrinciplesFrontmatterSchema`; `modules` and `lifecycleStates` added to `ProductConstitutionFrontmatterSchema`
  - 21 new unit tests covering compilation, staleness detection, gitignore management, and partial-governance handling
- Governance context pre-flight injected into `/primitiv.plan`, `/primitiv.tasks`, and `/primitiv.implement` — downstream agents now receive the full compiled `GovernanceContext` JSON block instead of re-reading raw markdown files

### Changed

- **`primitiv update` removed** — replaced entirely by `primitiv upgrade` which does everything `update` did plus directory sync and state migration

- `/primitiv.clarify` now uses `AskUserQuestion` tool for all clarifying questions — structured options, batching, previews, and forced wait instead of freeform text

- SpecKit-to-Primitiv migration command (`primitiv migrate speckit` / `/primitiv.migrate`) for brownfield projects adopting Primitiv
  - Multi-strategy constitution parser (H2 header → keyword fuzzy → fallback) splits SpecKit constitution into product + development constitutions
  - Per-spec tech stack re-referencing from SpecKit slugs to Primitiv spec IDs in architecture constitution
  - Merge strategy for pre-existing `.primitiv/` directories; idempotent re-runs
  - Sequential spec ID assignment with mapping table in migration report
- `/primitiv.implement` appends per-spec tech stack entry to `constitutions/architecture.md` after each spec completion
- GitNexus deep integration across all code-touching pipeline phases (plan, tasks, implement, test-feature, compushpr)
- GitNexus knowledge graph indexing with 4 core skills (exploring, debugging, impact-analysis, refactoring)
- GitNexus MCP tools referenced in pipeline commands with graceful fallback to manual search
- Impact analysis section in PR descriptions via `detect_changes`
- Audit trail module with NDJSON append-only logs per spec (`AuditManager`, `AuditRecordSchema`)
- Research utilities module for research.md template creation, validation, and parsing (`ResearchManager`)
- Contract utilities module for OpenAPI YAML file management in spec directories (`ContractManager`)
- Task DAG cycle detection and topological wave ordering (`taskValidator`)
- Default branch detection with fallback chain: `origin/HEAD` → `main` → `master` (`detectDefaultBranch`)
- `--filter <status>` flag for `primitiv status` command
- `--output <path>` flag for `primitiv status` to generate markdown reports
- Audit trail integration into spec lifecycle (SPEC_CREATED, STATUS_CHANGED records)
- Comprehensive test suite: SpecManager, PrimitivEngine, gate validation, status command (56 new tests)
- Claude Code slash commands for the full SDD pipeline (`.claude/commands/`)
- GitNexus MCP server integration (`.mcp.json`)
