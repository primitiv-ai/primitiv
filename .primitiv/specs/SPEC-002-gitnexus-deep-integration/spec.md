---
type: spec
id: SPEC-002
title: "GitNexus Deep Integration — Knowledge Graph Across All Pipeline Phases"
status: completed
version: 2
branch: "spec/SPEC-002-gitnexus-deep-integration"
author: "Dieu"
createdAt: "2026-03-15T10:00:00Z"
updatedAt: "2026-03-15T10:35:00Z"
---

# SPEC-002: GitNexus Deep Integration — Knowledge Graph Across All Pipeline Phases

## Description

The Primitiv Spec Engine currently configures the GitNexus MCP server (`.mcp.json`), but does **not** install, index, or leverage GitNexus itself. This spec covers the full integration of GitNexus into the project so that every pipeline phase that touches code — planning, task breakdown, implementation, testing, and review — uses the GitNexus knowledge graph to navigate the codebase instead of performing expensive file-by-file searches.

### Current State

- `.mcp.json` declares the `gitnexus` MCP server (`npx gitnexus@latest mcp`)
- The repository has **not been indexed** — no `.gitnexus/` directory exists
- No GitNexus skills are installed (`.claude/skills/` has no gitnexus files)
- Pipeline commands already have **partial** GitNexus references:
  - `primitiv.plan.md` — references `query`, `context`, `impact` with manual fallback
  - `primitiv.implement.md` — references `context` briefly
  - `primitiv.tasks.md`, `primitiv.test-feature.md`, `primitiv.compushpr.md` — no GitNexus references

### Target State

1. **GitNexus is installed and the repo is indexed** — run `npx gitnexus analyze --skills` to generate the `.gitnexus/` directory and community-specific skills
2. **GitNexus setup is run** — `npx gitnexus setup` auto-installs skills, hooks (PostToolUse for auto-reindexing), and validates MCP config for Claude Code
3. **Five Primitiv pipeline commands leverage GitNexus MCP tools** (enhanced, not rewritten):
   - `/primitiv.plan` — enhance existing GitNexus references with more specific tool guidance per sub-step
   - `/primitiv.tasks` — use `impact` and `context` to identify affected files and dependencies per task
   - `/primitiv.implement` — enhance existing reference; add `impact` before code changes, `detect_changes` after implementation
   - `/primitiv.test-feature` — use `query` to discover related code paths and ensure test coverage
   - `/primitiv.compushpr` — use `detect_changes` to enrich PR descriptions with impact analysis
4. **Auto-reindexing** — GitNexus PostToolUse hooks (installed via `setup`) refresh the index after commits automatically
5. **All commands maintain graceful degradation** — if GitNexus is not indexed, commands fall back to standard file search (Glob/Grep/Read)

### Phases NOT modified

- `/primitiv.specify` — creates specs from descriptions, no code navigation needed
- `/primitiv.clarify` — resolves spec ambiguities through Q&A, no code graph queries needed
- `/primitiv.gate-1`, `/primitiv.gate-2` — governance checks, not code-related
- `/primitiv.constitution` — generates constitutions, not code-related

### Why This Matters

- **Token savings**: GitNexus precomputes code relationships at index time. Instead of agents performing multi-step file searches (Glob -> Read -> Grep -> Read...), a single `query` or `context` call returns complete architectural context including callers, callees, type info, and process flows.
- **Speed**: Queries against the knowledge graph return in milliseconds vs. multiple sequential tool calls.
- **Accuracy**: The knowledge graph captures relationships that text search misses — inheritance chains, constructor inference, cross-module call graphs, re-exports.
- **Blast radius awareness**: Before any code change, `impact` reveals all affected symbols and files, preventing unintended regressions.

## Setup Process

First-time initialization is a two-command workflow:

```bash
npx gitnexus analyze --skills   # Index repo + generate community-specific skills
npx gitnexus setup              # Auto-install MCP config, skills, and hooks for Claude Code
```

After setup, the GitNexus PostToolUse hooks handle automatic reindexing after git commits.

## Acceptance Criteria

- [ ] Running `npx gitnexus analyze --skills` successfully indexes the repository, creates `.gitnexus/`, and generates community-specific skills
- [ ] `npx gitnexus setup` installs core skills, hooks, and validates MCP config for Claude Code
- [ ] `.gitnexus/` is added to `.gitignore`
- [ ] The four core GitNexus skills (exploring, debugging, impact analysis, refactoring) are available in `.claude/skills/`
- [ ] `/primitiv.plan` enhanced with more specific GitNexus tool guidance per planning sub-step
- [ ] `/primitiv.tasks` references GitNexus `impact` and `context` for per-task file dependencies and blast radius
- [ ] `/primitiv.implement` enhanced with `impact` before code changes and `detect_changes` after implementation
- [ ] `/primitiv.test-feature` references GitNexus `query` to discover related code paths for test coverage
- [ ] `/primitiv.compushpr` references GitNexus `detect_changes` to enrich PR descriptions with impact analysis
- [ ] All five modified commands include graceful fallback to manual search when GitNexus is unavailable
- [ ] The GitNexus MCP server configuration in `.mcp.json` remains functional and unchanged
- [ ] After changes, all existing pipeline commands continue to work correctly (no regressions)

## Constraints

- **No changes to the MCP server config** — `.mcp.json` already correctly configures the GitNexus MCP server
- **GitNexus is a dev-time tool only** — it does not affect production builds, runtime behavior, or deployed code
- **Commands must degrade gracefully** — if GitNexus is not indexed (e.g., fresh clone), pipeline commands must still work, falling back to standard file search. GitNexus usage is additive, not a hard dependency
- **Enhance, don't rewrite** — existing GitNexus references in plan/implement are preserved and extended; new references follow the same pattern
- **Use `npx gitnexus setup`** — do not manually create skill files or hooks that GitNexus can auto-install
- **Index must be gitignored** — `.gitnexus/` contains machine-local data and must never be committed
- **No custom GitNexus modifications** — use the published `gitnexus` npm package as-is via `npx`
- **TypeScript/JavaScript focus** — GitNexus must index the project's TypeScript codebase; other language support is irrelevant for this repo

## Out of Scope

- Building a custom GitNexus plugin or extension
- Integrating GitNexus into CI/CD pipelines or production systems
- Web UI deployment (`gitnexus serve` / browser explorer)
- Semantic embeddings generation (`--embeddings` flag) — can be added later if needed
- Multi-repo support — this project is a single repository
- Modifying GitNexus source code or contributing upstream
- Changes to `/primitiv.specify`, `/primitiv.clarify`, `/primitiv.gate-1`, `/primitiv.gate-2`, or `/primitiv.constitution`
- Un-ignoring `.primitiv/` in `.gitignore` (separate concern)
