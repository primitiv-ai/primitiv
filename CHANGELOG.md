# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
