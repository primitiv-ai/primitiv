---
type: plan
version: 1
specId: SPEC-001
approach: "Library-first TypeScript pipeline in src/lib/pipeline/ with thin CLI scripts, full Next.js project scaffold, file-based artifacts"
fileChanges:
  # === PROJECT SCAFFOLD ===
  - path: "package.json"
    action: create
    description: "Project manifest with all dependencies from architecture constitution"
  - path: "tsconfig.json"
    action: create
    description: "TypeScript strict config with path aliases"
  - path: "next.config.ts"
    action: create
    description: "Next.js 16 configuration"
  - path: "tailwind.config.ts"
    action: create
    description: "Tailwind CSS config with dark mode, Lato font, design tokens"
  - path: "postcss.config.mjs"
    action: create
    description: "PostCSS config for Tailwind"
  - path: ".env.example"
    action: create
    description: "Environment variable template (DATABASE_URL, etc.)"
  - path: "src/lib/env.ts"
    action: create
    description: "Zod-validated environment variables"
  - path: "docker-compose.yml"
    action: create
    description: "Local dev services: PostgreSQL, Temporal server, Temporal UI"
  - path: "prisma/schema.prisma"
    action: create
    description: "Prisma schema with initial models (User, AuditLog — scaffold only)"
  - path: "src/lib/db.ts"
    action: create
    description: "Prisma client singleton"
  - path: "src/app/layout.tsx"
    action: create
    description: "Root layout with Lato font, dark mode, providers"
  - path: "src/app/page.tsx"
    action: create
    description: "Landing page placeholder"
  - path: "src/app/globals.css"
    action: create
    description: "Global styles, CSS variables, Tailwind directives"
  - path: "components.json"
    action: create
    description: "shadcn/ui configuration"
  - path: ".eslintrc.json"
    action: create
    description: "ESLint config with TypeScript strict rules"
  - path: ".prettierrc"
    action: create
    description: "Prettier configuration"
  - path: "vitest.config.ts"
    action: create
    description: "Vitest configuration for unit and integration tests"
  - path: "playwright.config.ts"
    action: create
    description: "Playwright configuration for E2E tests"
  - path: ".gitignore"
    action: create
    description: "Git ignore for node_modules, .next, .env, etc."

  # === PIPELINE LIBRARY ===
  - path: "src/lib/pipeline/types.ts"
    action: create
    description: "TypeScript types and Zod schemas for all pipeline entities (Spec, GateResult, Task, AuditRecord, PipelineState)"
  - path: "src/lib/pipeline/state.ts"
    action: create
    description: "Read/write .primitiv/.state.json — getState(), updateState(), incrementSpecId()"
  - path: "src/lib/pipeline/spec.ts"
    action: create
    description: "Spec CRUD operations — createSpec(), readSpec(), updateSpecStatus(), listSpecs(), generateSlug(), generateSpecId()"
  - path: "src/lib/pipeline/gates.ts"
    action: create
    description: "Gate check engine — checkGate1(), checkGate2(), checkGate3(), runAllGates(). Pure functions returning GateResult[]"
  - path: "src/lib/pipeline/git.ts"
    action: create
    description: "Git operations — detectDefaultBranch(), createSpecBranch(), getCurrentBranch(), getSpecIdFromBranch()"
  - path: "src/lib/pipeline/audit.ts"
    action: create
    description: "Audit trail — appendAuditRecord(), readAuditLog(). NDJSON append to audit.log"
  - path: "src/lib/pipeline/frontmatter.ts"
    action: create
    description: "Frontmatter utilities — readMarkdownWithFrontmatter(), writeMarkdownWithFrontmatter(). Wraps gray-matter"
  - path: "src/lib/pipeline/status.ts"
    action: create
    description: "Pipeline status — getStatusTable(), formatStatusOutput(), writeStatusReport(). Scans all specs, builds table"
  - path: "src/lib/pipeline/research.ts"
    action: create
    description: "Research utilities — createResearchTemplate(), validateResearch(). Helpers for AI-generated research.md"
  - path: "src/lib/pipeline/contracts.ts"
    action: create
    description: "Contract utilities — writeContract(), validateOpenApiYaml(). Helpers for contracts/ directory"
  - path: "src/lib/pipeline/tasks.ts"
    action: create
    description: "Task utilities — parseTasks(), validateTaskDependencies(), checkForCycles(). DAG validation"
  - path: "src/lib/pipeline/index.ts"
    action: create
    description: "Pipeline library barrel export"

  # === CLI SCRIPTS ===
  - path: "src/cli/create-spec.ts"
    action: create
    description: "CLI: create a new spec — reads args, calls createSpec(), runs gates, creates branch, outputs results"
  - path: "src/cli/check-gates.ts"
    action: create
    description: "CLI: run gate checks on a spec — reads spec from branch or arg, runs all gates, outputs results"
  - path: "src/cli/pipeline-status.ts"
    action: create
    description: "CLI: show pipeline status — scans specs, outputs formatted table, supports --filter and --output flags"

  # === TESTS ===
  - path: "src/lib/pipeline/__tests__/state.test.ts"
    action: create
    description: "Tests for state management — read, write, increment, edge cases"
  - path: "src/lib/pipeline/__tests__/spec.test.ts"
    action: create
    description: "Tests for spec operations — create, read, update status, list, slug generation, ID formatting"
  - path: "src/lib/pipeline/__tests__/gates.test.ts"
    action: create
    description: "Tests for gate checks — pass/warn/fail scenarios for all 3 gates, missing gate docs, violations"
  - path: "src/lib/pipeline/__tests__/git.test.ts"
    action: create
    description: "Tests for git operations — branch detection, spec branch creation, branch name parsing"
  - path: "src/lib/pipeline/__tests__/audit.test.ts"
    action: create
    description: "Tests for audit trail — append record, read log, NDJSON format validation"
  - path: "src/lib/pipeline/__tests__/frontmatter.test.ts"
    action: create
    description: "Tests for frontmatter parsing — read/write roundtrip, edge cases, invalid YAML"
  - path: "src/lib/pipeline/__tests__/status.test.ts"
    action: create
    description: "Tests for pipeline status — table formatting, filtering, markdown output"
  - path: "src/lib/pipeline/__tests__/tasks.test.ts"
    action: create
    description: "Tests for task utilities — dependency validation, cycle detection, DAG ordering"
risks:
  - "Git operations in tests require a real git repo — test setup must initialize a temp git repo per test suite"
  - "gray-matter may have edge cases with complex YAML (nested arrays, special characters in strings)"
  - "Default branch detection may fail on repos without a remote — need robust fallback chain (origin/HEAD → local main → local master)"
  - "File system operations are not atomic — concurrent CLI invocations could corrupt .state.json (mitigated by single-builder assumption)"
  - "Next.js 16 is bleeding edge — some ecosystem tools may not fully support it yet"
dependencies:
  - "Node.js >= 20 (required for Next.js 16)"
  - "gray-matter (frontmatter parsing)"
  - "js-yaml (YAML serialization for contracts)"
  - "tsx (TypeScript execution for CLI scripts)"
  - "Git CLI (installed on the host)"
codebaseAnalysis:
  existingCode:
    - ".primitiv/ directory structure with gates and constitutions (governance documents)"
    - ".primitiv/.state.json with initial state (nextSpecId: 2)"
    - ".claude/commands/ with 10 slash command definitions (markdown prompts)"
    - "SPEC-001 spec, clarifications, and checklist already exist as artifacts"
  reusableModules:
    - "No existing TypeScript modules — greenfield project"
    - ".claude/commands/ define the workflow but contain no reusable code"
    - ".primitiv/ directory conventions are already established and must be followed"
  patternsToFollow:
    - "YAML frontmatter pattern already used by spec.md, constitutions, and gate documents"
    - "Directory naming: SPEC-XXX-<slug> pattern established by SPEC-001"
    - "State tracking via .state.json already in use"
    - "Architecture constitution defines src/ directory structure to follow"
updatedAt: "2026-03-15T00:30:00Z"
---

# Technical Plan: SPEC-001 — Spec-Driven Development Pipeline

## 1. Approach

Build the Primitive Platform as a **full Next.js 16 project** with the spec-driven development pipeline implemented as a **TypeScript library** (`src/lib/pipeline/`) plus thin **CLI scripts** (`src/cli/`).

The implementation has two layers:

1. **Project scaffold** — Initialize the complete stack from the architecture constitution (Next.js 16, Prisma, PostgreSQL, Temporal, shadcn/ui, Tailwind, Zod, better-auth, Docker Compose). This establishes the foundation for all subsequent specs.

2. **Pipeline library + CLI** — TypeScript functions for every pipeline operation (spec CRUD, gate checks, audit trail, status reporting). CLI scripts provide terminal entry points. The existing Claude Code slash commands continue to work alongside these tools.

## 2. Codebase Analysis

### What exists
- **Governance documents**: 2 gates + 3 constitutions fully defined in `.primitiv/`
- **State file**: `.primitiv/.state.json` tracking spec IDs
- **Slash commands**: 10 Claude Code commands in `.claude/commands/` defining the SDD workflow
- **SPEC-001 artifacts**: spec.md, clarifications.md, requirements checklist — already following the directory conventions

### What to reuse
- **Nothing** — this is greenfield. No TypeScript, no `package.json`, no application code exists.
- The `.primitiv/` directory structure and file naming conventions are already established and must be preserved.

### Patterns to follow
- **YAML frontmatter** in all markdown artifacts (already used consistently)
- **`SPEC-XXX-<slug>`** directory naming (established by SPEC-001)
- **Architecture constitution** directory structure for `src/`
- **Development constitution** conventions: strict TypeScript, Zod validation, no `any`, TDD, structured logging

## 3. Architecture

```
src/
  app/                          # Next.js App Router (scaffold — minimal for SPEC-001)
    layout.tsx                  # Root layout (Lato, dark mode, providers)
    page.tsx                    # Landing placeholder
    globals.css                 # Tailwind directives, CSS vars
  lib/
    db.ts                       # Prisma singleton
    env.ts                      # Zod env validation
    pipeline/                   # ← SPEC-001 core implementation
      types.ts                  # Zod schemas + TypeScript types
      state.ts                  # .state.json management
      spec.ts                   # Spec CRUD + ID generation
      gates.ts                  # Gate check engine (pure functions)
      git.ts                    # Git branch operations
      audit.ts                  # NDJSON audit trail
      frontmatter.ts            # gray-matter wrapper
      status.ts                 # Pipeline status scanner
      research.ts               # Research template helpers
      contracts.ts              # OpenAPI contract helpers
      tasks.ts                  # Task parsing + DAG validation
      index.ts                  # Barrel export
      __tests__/                # Vitest test suites
        state.test.ts
        spec.test.ts
        gates.test.ts
        git.test.ts
        audit.test.ts
        frontmatter.test.ts
        status.test.ts
        tasks.test.ts
  cli/                          # Thin CLI entry points
    create-spec.ts              # tsx src/cli/create-spec.ts "feature description"
    check-gates.ts              # tsx src/cli/check-gates.ts [SPEC-XXX]
    pipeline-status.ts          # tsx src/cli/pipeline-status.ts [--filter status] [--output path]
```

### How it fits the existing system

The pipeline library is a pure Node.js module with no Next.js dependency. It reads/writes files in `.primitiv/` and executes git commands. This means:

- **Slash commands** can call CLI scripts via Bash tool: `tsx src/cli/create-spec.ts "..."`
- **Future web UI** can import from `@/lib/pipeline` directly in Server Actions
- **Tests** run via Vitest with no browser or Next.js server required

## 4. Implementation Phases

### Phase A: Project Scaffold
Initialize the full Next.js project with all dependencies. Establish directory structure, configuration files, and dev tooling. This is a one-time setup that all subsequent specs build upon.

**Files**: package.json, tsconfig.json, next.config.ts, tailwind.config.ts, docker-compose.yml, prisma/schema.prisma, src/app/layout.tsx, src/app/page.tsx, vitest.config.ts, playwright.config.ts, .eslintrc.json, .prettierrc, .gitignore, .env.example, components.json

### Phase B: Pipeline Core Library
Build the core pipeline functions — types, state management, frontmatter parsing, spec CRUD, ID generation, slug generation. These are the foundational building blocks with no external dependencies beyond `gray-matter`.

**Files**: src/lib/pipeline/types.ts, state.ts, frontmatter.ts, spec.ts, index.ts
**Tests**: state.test.ts, frontmatter.test.ts, spec.test.ts

### Phase C: Gate Check Engine
Implement the three-gate validation system. Pure functions that parse gate/constitution documents and check spec alignment. Return structured results.

**Files**: src/lib/pipeline/gates.ts
**Tests**: gates.test.ts

### Phase D: Git & Audit
Git branch management (detect default branch, create spec branches, parse branch names) and audit trail (NDJSON append/read).

**Files**: src/lib/pipeline/git.ts, audit.ts
**Tests**: git.test.ts, audit.test.ts

### Phase E: Status, Research, Contracts, Tasks
Pipeline status scanner, research template utilities, OpenAPI contract helpers, task DAG validation.

**Files**: src/lib/pipeline/status.ts, research.ts, contracts.ts, tasks.ts
**Tests**: status.test.ts, tasks.test.ts

### Phase F: CLI Scripts
Thin CLI entry points that wire up the library functions with argument parsing and formatted output.

**Files**: src/cli/create-spec.ts, check-gates.ts, pipeline-status.ts

## 5. Key Technical Decisions

| Decision | Choice | Reference |
|----------|--------|-----------|
| CLI implementation | Library functions + thin scripts via `tsx` | R-001 |
| Frontmatter parsing | `gray-matter` | R-002 |
| State management | JSON file, no locking | R-003 |
| Status scanning | Direct filesystem scan + frontmatter parse | R-004 |
| Gate checks | Pure functions, rule-based | R-005 |
| Git operations | `child_process.execSync` | R-006 |
| OpenAPI generation | `js-yaml` serialization | R-007 |
| Project scaffold | Full stack from architecture constitution | R-008 |
| Audit trail | NDJSON per-spec audit.log | R-009 |

## 6. Risks

1. **Git in tests**: Tests involving git operations need a temp git repo. Mitigated by creating a test fixture helper that initializes/cleans up a temp repo per suite.

2. **Next.js 16 ecosystem**: Bleeding edge — some tools may lag behind. Mitigated by pinning exact versions and testing early.

3. **Default branch detection**: May fail on repos without remotes. Mitigated by a fallback chain: `origin/HEAD` → local `main` → local `master` → error with instructions.

4. **State file corruption**: Concurrent CLI invocations could race on `.state.json`. Mitigated by single-builder assumption (documented in clarifications). Can add file locking later.

5. **gray-matter edge cases**: Complex YAML with special characters. Mitigated by using Zod to validate parsed frontmatter after gray-matter extracts it.

## 7. Dependencies

| Package | Purpose | Dev/Prod |
|---------|---------|----------|
| next@16 | Web framework | prod |
| react, react-dom | UI | prod |
| prisma, @prisma/client | ORM | prod |
| zod | Validation | prod |
| gray-matter | Frontmatter parsing | prod |
| js-yaml, @types/js-yaml | YAML serialization | prod |
| better-auth | Authentication | prod |
| @temporalio/client, @temporalio/worker | Workflows | prod |
| tailwindcss, postcss, autoprefixer | Styling | prod |
| @radix-ui/* | UI primitives | prod |
| tsx | TypeScript CLI execution | dev |
| vitest | Unit/integration testing | dev |
| @playwright/test | E2E testing | dev |
| typescript | Type checking | dev |
| eslint, prettier | Linting/formatting | dev |
| @types/node | Node.js types | dev |

## 8. Constitution Check

### Gate 1 — Company Principles
- **Specification First**: The pipeline enforces specs before implementation ✓
- **Structural Discipline**: Deterministic stages with gate validation ✓
- **Simplicity**: File-based, no unnecessary database for v1 ✓
- **Verifiability**: Gate checks + audit trail ✓
- **Automation**: AI-driven research, automated gate checks ✓
- **Governance**: Three gates strictly blocking progression ✓

### Gate 2 — Security Principles
- **Audit trail**: NDJSON per-spec audit logs ✓
- **Data minimization**: Only spec artifacts stored ✓
- **No credentials in code**: .env.example template, .gitignore excludes .env ✓
- **Input validation**: Zod schemas for all pipeline entities ✓

### Gate 3 — Constitutions
- **Product**: Implements Spec Engine and Build Orchestration modules ✓
- **Architecture**: Follows monolithic modular pattern, lives in src/lib/ ✓
- **Development**: Strict TypeScript, TDD, Zod validation, structured logging ✓
