# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
