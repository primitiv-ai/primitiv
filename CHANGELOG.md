# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
