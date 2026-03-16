# Research: Spec-Driven Development Pipeline

**Feature**: SPEC-001-spec-driven-dev-pipeline
**Date**: 2026-03-15

## Decisions

### R-001: CLI Implementation Approach

**Decision**: Implement pipeline operations as TypeScript library functions in `src/lib/pipeline/`, invoked by thin Node.js CLI scripts in `src/cli/`. The existing Claude Code slash commands (`.claude/commands/`) call these CLI scripts via Bash tool or use the library functions directly via inline TypeScript logic.

**Rationale**: The pipeline needs to be both machine-callable (from slash commands and future AI agents) and human-callable (from terminal). A library-first approach means the core logic is reusable — slash commands, CLI scripts, and the future web UI can all consume the same functions. Thin CLI entry points keep the scripts simple and testable.

**Alternatives considered**:
- Pure slash commands (no application code) → rejected: not testable, not reusable by future web UI, logic trapped in markdown prompts
- Full CLI framework (Commander.js, oclif) → rejected: over-engineering for the current scope; simple `tsx` scripts with `process.argv` parsing are sufficient. Can adopt a framework later if CLI surface grows significantly
- Make slash commands the only interface → rejected: violates "Verifiability" principle (can't unit test markdown prompts)

### R-002: YAML Frontmatter Parsing

**Decision**: Use `gray-matter` for reading/writing YAML frontmatter in markdown files.

**Rationale**: `gray-matter` is the de facto standard for frontmatter parsing in the Node.js ecosystem. It handles reading and serializing frontmatter, supports all YAML types, preserves markdown content, and has zero dependencies beyond `js-yaml`. It's what Next.js MDX tooling, Astro, and most static site generators use.

**Alternatives considered**:
- Manual regex parsing → rejected: fragile, error-prone with multiline YAML
- `front-matter` npm package → rejected: read-only, cannot serialize back to file
- `js-yaml` directly with manual split → acceptable but reinvents what `gray-matter` already does

### R-003: File-Based State Management

**Decision**: Use `.primitiv/.state.json` as a simple JSON file read/written atomically via `fs.readFileSync` + `fs.writeFileSync`. No file locking mechanism for v1.

**Rationale**: The clarification confirms single-builder-at-a-time usage. Atomic read-then-write is sufficient for sequential CLI operations. The state file is small (< 1KB) and changes infrequently. File locking adds complexity with no benefit until concurrent access is needed.

**Alternatives considered**:
- SQLite for state → rejected: over-engineering; adds a dependency for storing 3 integers
- Lock file mechanism (`proper-lockfile`) → rejected: not needed for single-builder assumption; can be added later if concurrency is introduced
- In-memory only → rejected: state must persist between CLI invocations

### R-004: Spec Directory Scanning for Status

**Decision**: Scan `.primitiv/specs/*/spec.md` using `fs.readdirSync` + `gray-matter` to read frontmatter from each spec file. Build the status table from frontmatter fields (id, title, status, author, branch, createdAt, updatedAt).

**Rationale**: Simple, no index file to maintain. The number of specs in a single project is bounded (hundreds, not thousands). Scanning and parsing frontmatter from spec files takes milliseconds. This is consistent with the "file-based artifacts" clarification — the spec files themselves are the source of truth, not a separate index.

**Alternatives considered**:
- Maintain a specs index in `.state.json` → rejected: creates two sources of truth, requires sync logic
- Generate a SQLite index → rejected: adds complexity and a dependency
- Search git branches for spec branches → rejected: slower, requires git operations, doesn't capture status transitions

### R-005: Gate Check Implementation

**Decision**: Implement gate checks as pure functions that take a parsed spec and a parsed gate/constitution document, returning a `GateResult` object with `status: 'pass' | 'warn' | 'fail'`, `gate: string`, and `details: string[]`. Gate checks are rule-based pattern matching against the spec content.

**Rationale**: Gate checks need to be deterministic and testable. Pure functions with structured input/output are easy to unit test and compose. For v1, gate checks validate structural requirements (required sections present, no implementation details) and keyword-based alignment (spec mentions concepts from the gate documents). AI-powered semantic analysis can be layered on top in a future version.

**Alternatives considered**:
- AI-powered semantic gate checking → deferred: adds latency and non-determinism; v1 should be fast and predictable. Can be added as an optional enhancement
- Manual gate approval workflow → rejected: contradicts "Automation" principle and clarification that gates are strictly automated
- Regex-only checks → too limited; need structured YAML parsing to check frontmatter compliance

### R-006: Git Branch Management

**Decision**: Use `child_process.execSync` to run git commands for branch creation. Detect default branch via `git symbolic-ref refs/remotes/origin/HEAD` with fallback to checking if `main` or `master` exists locally.

**Rationale**: Git operations are inherently shell commands. Using `child_process.execSync` is the simplest, most reliable approach. No git library dependency needed. Default branch detection handles the common main/master ambiguity. The operations are sequential and synchronous — no need for async git.

**Alternatives considered**:
- `simple-git` npm package → rejected: adds a dependency for ~5 git commands; `execSync` is sufficient
- `isomorphic-git` → rejected: designed for browser/pure-JS environments; overkill for CLI
- Always assume `main` → rejected: breaks for repos using `master` (like this one)

### R-007: OpenAPI Contract Generation

**Decision**: Generate OpenAPI 3.1 YAML files using template literals and `js-yaml` serialization. No OpenAPI-specific library needed for v1.

**Rationale**: The contracts are generated during the planning phase by AI agents analyzing the spec. The output is a YAML file following OpenAPI 3.1 structure. For v1, the AI agent (slash command) generates the contract content and the library provides a `writeContract(specDir, content)` utility. No programmatic OpenAPI construction is needed — the AI produces the structured content directly.

**Alternatives considered**:
- `@apidevtools/swagger-parser` for validation → deferred: useful but not essential for v1; can validate contracts as a gate check enhancement
- Programmatic OpenAPI builder (`openapi3-ts`) → rejected: AI generates the content directly; a builder adds abstraction without value
- JSON instead of YAML → rejected: YAML is more readable for humans reviewing contracts

### R-008: Project Scaffold Strategy

**Decision**: Initialize the project with the full stack defined in the architecture constitution (Next.js 16, Prisma, PostgreSQL, Temporal, better-auth, shadcn/ui, Tailwind, Zod) even though SPEC-001 only uses a subset. The pipeline library and CLI scripts run as standalone TypeScript via `tsx`.

**Rationale**: The architecture constitution defines the canonical stack. Setting up the full scaffold now means subsequent specs don't need to re-scaffold. SPEC-001's pipeline code lives in `src/lib/pipeline/` and `src/cli/` and uses only Node.js APIs + `gray-matter` + `js-yaml`. The Next.js app, Prisma schema, and other framework pieces are scaffolded but not actively used until later specs implement web UI features.

**Alternatives considered**:
- Minimal scaffold (only what SPEC-001 needs) → rejected: every subsequent spec would need to add framework setup, causing scope creep and integration risk
- Separate pipeline package (monorepo) → deferred: adds tooling complexity (workspaces, build pipeline); can extract later if needed
- Pipeline as a standalone Node.js project outside Next.js → rejected: violates the monolithic modular architecture; pipeline code should live alongside the platform

### R-009: Audit Trail for Stage Transitions

**Decision**: Append audit records to `.primitiv/specs/SPEC-XXX-<slug>/audit.log` as newline-delimited JSON (NDJSON). Each line is a JSON object with `timestamp`, `actor`, `action`, `specId`, `previousStatus`, `newStatus`.

**Rationale**: File-based, append-only, human-readable, and machine-parseable. NDJSON is the standard format for structured log files. Each spec has its own audit log, keeping audit data colocated with the spec. No database needed. The format is trivially grep-able and can be loaded into any analytics tool.

**Alternatives considered**:
- Single global audit log → rejected: doesn't scale with number of specs; harder to find spec-specific history
- Structured markdown audit section in spec.md → rejected: mixing audit data with spec content; audit is append-only but specs are edited
- SQLite audit table → rejected: adds a database dependency for simple append-only logging
