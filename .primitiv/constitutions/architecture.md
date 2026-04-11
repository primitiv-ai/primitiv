---
type: arch-constitution
version: 2
patterns:
  style: "Node.js/TypeScript CLI with a layered engine; optional embedded Next.js viewer"
  communication: "Commander-dispatched CLI commands call engine classes; engines read/write markdown + YAML files on the user's filesystem; viewer Server Components import the same engines via a tsconfig path alias"
  dataFlow: "User → Commander CLI → Command handler → Engine class → `.primitiv/` filesystem (markdown + YAML) → Engine → Command handler → CLI output (chalk / clack / cli-table3). Viewer: Browser → Next.js Server Component → Engine class → `.primitiv/` filesystem → rendered HTML."
boundaries:
  - name: "CLI Entry"
    description: "Commander setup, top-level command registration, version reporting, global flags"
    owns:
      - "src/cli.ts"
      - "src/bin/primitiv.ts (published binary entry)"
      - "Top-level argument parsing and command dispatch"
  - name: "Command Layer"
    description: "One file per user-facing CLI command; thin orchestration over engine classes"
    owns:
      - "src/commands/init.ts"
      - "src/commands/install.ts"
      - "src/commands/upgrade.ts"
      - "src/commands/compile.ts"
      - "src/commands/status.ts"
      - "src/commands/validate.ts"
      - "src/commands/migrate.ts"
      - "src/commands/learn.ts"
      - "src/commands/view.ts (added by SPEC-013)"
  - name: "Engine Layer"
    description: "Domain operations over governance artifacts — the reuse seam for both the CLI and the viewer"
    owns:
      - "src/engine/PrimitivEngine.ts"
      - "src/engine/SpecManager.ts"
      - "src/engine/GateManager.ts"
      - "src/engine/ConstitutionManager.ts"
      - "src/engine/LearningManager.ts"
      - "src/engine/GovernanceCompiler.ts"
      - "src/engine/MigrationManager.ts"
      - "src/engine/ResearchManager.ts"
      - "src/engine/AuditManager.ts"
      - "src/engine/ContractManager.ts"
      - "src/engine/FeatureRegistryManager.ts"
  - name: "Schema Layer"
    description: "Zod schemas — single source of truth for runtime validation and TypeScript types"
    owns:
      - "src/schemas/**"
      - "z.infer<> derivations for all engine return types"
  - name: "State Layer"
    description: "Spec lifecycle state machine and status transitions"
    owns:
      - "src/state/specStateMachine.ts"
      - "Transition rules (draft → gate-1-passed → ... → completed)"
  - name: "Install & Template Layer"
    description: "Project bootstrapping — copies templates into a user's repo on `primitiv init` / `upgrade`"
    owns:
      - "src/init/**"
      - "templates/commands/**"
      - "templates/specs/**"
      - "templates/.primitiv/**"
  - name: "CLI UI Layer"
    description: "Interactive prompts, banners, tables, and formatted terminal output"
    owns:
      - "src/ui/**"
      - "@clack/prompts wizards"
      - "chalk / gradient-string output"
      - "cli-table3 rendering"
  - name: "Git Integration"
    description: "Branch creation, checkout, and git-aware helpers used by spec commands"
    owns:
      - "src/git/**"
  - name: "Governance Store"
    description: "Filesystem layout inside a Primitiv-initialised project — the single source of truth for all governance artifacts"
    owns:
      - ".primitiv/.state.json"
      - ".primitiv/gates/*.md"
      - ".primitiv/constitutions/*.md"
      - ".primitiv/specs/SPEC-XXX-*/**"
      - ".primitiv/learnings/*.md"
  - name: "Web Viewer (optional surface)"
    description: "Read-only Next.js 16 application that renders the Governance Store in a browser; added by SPEC-013"
    owns:
      - "apps/viewer/**"
      - "Next.js App Router pages, Server Components, layouts"
      - "shadcn/ui + Radix + Tailwind CSS components"
      - "react-markdown + remark-gfm rendering pipeline"
      - "chokidar + WebSocket live-reload bridge"
      - "Prebuilt standalone bundle shipped as dist/viewer/ in the published tarball"
adrs:
  - id: "ADR-001"
    title: "Primitiv repo is the CLI, not the Platform"
    status: "accepted"
    date: "2026-04-11"
    context: "The previous architecture constitution described the Primitiv Platform (a hosted Next.js + Postgres + Temporal product). This repo is a different artifact: the Node/TypeScript CLI that implements the spec-driven development pipeline on a user's machine."
    decision: "The architecture constitution describes the CLI's architecture. The Primitiv Platform has its own constitution in its own repo and is out of scope here."
    consequences: "Specs added to this repo are judged against the CLI's stack (Node + TS + Commander + Zod + gray-matter + @clack/prompts), not the Platform's. Platform technologies (Prisma, Postgres, Temporal, better-auth) are not mandated here and their absence is not a deviation."
  - id: "ADR-002"
    title: "Filesystem as the source of truth"
    status: "accepted"
    date: "2026-04-11"
    context: "A CLI that drives governance artifacts needs a storage model. Options: local SQLite, remote database, flat files."
    decision: "All state lives on the user's filesystem inside `.primitiv/` as markdown files with YAML frontmatter, plus `.primitiv/.state.json` for minimal metadata. Governance artifacts are human-readable, human-editable, diffable, and version-controlled by the user's own git."
    consequences: "No database dependency, no network I/O for reads, trivial backup story (it's just files), and specs are reviewable in pull requests. The filesystem layout is part of the public contract — any change requires a migration path via `primitiv upgrade`."
  - id: "ADR-003"
    title: "Engine layer is the reuse seam between CLI and viewer"
    status: "accepted"
    date: "2026-04-11"
    context: "SPEC-013 adds a Next.js viewer that needs to parse the same files the CLI parses. Duplicating parsing logic would guarantee drift."
    decision: "The viewer imports engine classes (`SpecManager`, `GateManager`, `ConstitutionManager`, `LearningManager`) directly from `src/engine/` via a tsconfig path alias. The viewer's Server Components call these engines the same way CLI command handlers do. Next.js's `transpilePackages` (or equivalent) compiles the out-of-tree imports."
    consequences: "Single source of truth for parsing and validation. The engine layer must remain Node-runtime compatible (no DOM APIs, no Node-specific globals that fail inside a Next.js RSC context). A future monorepo move to `packages/core` becomes a mechanical refactor along the same seam."
  - id: "ADR-004"
    title: "Viewer ships as a prebuilt Next.js standalone bundle"
    status: "accepted"
    date: "2026-04-11"
    context: "The viewer is a Next.js app but the CLI is published as a single npm package (`primitiv`). Users should not need to run `next build` on their machine."
    decision: "`apps/viewer/next.config.ts` sets `output: 'standalone'`. The publish pipeline runs `next build` against `apps/viewer/` and copies `.next/standalone/` + `.next/static/` + `public/` into `dist/viewer/` inside the npm tarball. `primitiv view` spawns `node dist/viewer/server.js`. `next` and `react` stay in `apps/viewer/package.json` devDependencies — they are never runtime dependencies of the root `primitiv` package (the standalone bundle inlines what it needs)."
    consequences: "The published tarball grows by the size of the standalone bundle (to be measured during the SPEC-013 plan phase). The viewer works fully offline. No dev toolchain on the user's machine. Breaking changes to Next.js only affect contributors rebuilding the viewer, never end users."
  - id: "ADR-005"
    title: "Viewer is read-only, loopback-bound, local-dev-only"
    status: "accepted"
    date: "2026-04-11"
    context: "A Next.js app that reads arbitrary files could easily grow into an editor, a hosted service, or a LAN-exposed dashboard. Each of those has very different security implications."
    decision: "The viewer is scoped as a read-only tool for the contributor running it on their own machine. It binds to `127.0.0.1` only, never `0.0.0.0`. It has no authentication because it has no network exposure beyond the loopback interface. It never writes to `.primitiv/` and has no mutation surface. File contents are never logged."
    consequences: "If a future spec wants to host the viewer as a shared service, it needs a new ADR that adds authentication, authorization, audit logging, and transport security — that is explicitly out of scope for the viewer under this ADR. SPEC-013 acceptance criteria enforce the loopback bind."
updatedAt: "2026-04-11T12:00:00Z"
---

# Architecture Constitution — Primitiv CLI

## 1. Scope of This Document

This constitution describes the architecture of the **Primitiv CLI** — the Node/TypeScript program published as the `primitiv` npm package that implements the spec-driven development pipeline on a user's machine. It governs the code in this repository.

It does **not** describe the Primitiv Platform (the hosted product). The Platform has its own constitution in its own repository. Conflating the two has caused confusion in the past (see ADR-001) and must be avoided going forward.

## 2. Architecture Overview

The Primitiv CLI is a **layered Node/TypeScript application** with a single optional embedded Next.js surface (the viewer). Its job is to create, validate, transform, and display governance artifacts stored as markdown files with YAML frontmatter inside a `.primitiv/` directory in the user's repository.

The core design is shaped by three observations:

1. **Governance artifacts are text.** Specs, gates, constitutions, learnings — all of them are markdown files humans read and edit. The CLI is the authoring assistant, not the storage system.
2. **The user's own git is the database.** Version history, branching, review, and rollback are already solved by git. The CLI leans on that rather than reinventing it.
3. **AI agents are the primary consumer.** The CLI is designed to be driven by slash commands in Claude Code (and peer agents). Commands produce deterministic, inspectable outputs so agents can reason about the project state.

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Language** | TypeScript (strict mode, no `any`) | All CLI code |
| **Runtime** | Node.js ≥ 18 | Published binary target |
| **CLI framework** | Commander | Command definition, argument parsing, help text |
| **Validation** | Zod | Runtime schemas + derived TypeScript types |
| **Frontmatter parsing** | gray-matter | YAML-in-markdown parsing |
| **Interactive prompts** | @clack/prompts | Init wizard, upgrade prompts |
| **Terminal UI** | chalk, gradient-string, cli-table3 | Formatted output, banners, tables |
| **Build (dev)** | tsc | Type-checked compilation |
| **Build (publish)** | esbuild | Fast bundled build for distribution |
| **Testing** | Vitest + memfs | Unit and integration tests with virtual filesystems |
| **Lint** | ESLint | Code style enforcement |
| **Viewer surface (optional)** | Next.js 16 App Router, shadcn/ui + Radix, Tailwind CSS, react-markdown + remark-gfm, chokidar, ws | Read-only web viewer added by SPEC-013 |

**Deliberately absent** (and, per ADR-001, not a deviation): database systems, ORMs, workflow engines, authentication libraries, server frameworks beyond the embedded viewer, container orchestration. The CLI is a single-process Node program driven by a human or an AI agent.

## 4. Repository Structure

```
src/                        # CLI source
  cli.ts                    # Commander entry, command registration
  index.ts                  # Public API surface (for tests and reuse)
  commands/                 # One file per CLI command
    init.ts
    install.ts
    upgrade.ts
    compile.ts
    status.ts
    validate.ts
    migrate.ts
    learn.ts
    view.ts                 # Added by SPEC-013
  engine/                   # Domain logic — the reuse seam
    PrimitivEngine.ts
    SpecManager.ts
    GateManager.ts
    ConstitutionManager.ts
    LearningManager.ts
    GovernanceCompiler.ts
    MigrationManager.ts
    ResearchManager.ts
    AuditManager.ts
    ContractManager.ts
    FeatureRegistryManager.ts
  schemas/                  # Zod schemas, single source of truth for types
  state/                    # Spec lifecycle state machine
  init/                     # Project bootstrap logic
  ui/                       # Terminal UI (clack prompts, banners)
  git/                      # Git integration helpers
  utils/                    # Shared utilities
  validation/               # Validation helpers

templates/                  # Shipped templates copied into user projects
  commands/                 # Slash command markdown templates
  specs/                    # Spec templates (README, etc.)
  .primitiv/                # Initial .primitiv/ scaffolding

apps/                       # Embedded applications
  viewer/                   # SPEC-013 Next.js 16 read-only viewer
    app/                    # Next.js App Router routes
    components/             # shadcn/ui + feature components
    lib/                    # Viewer-specific helpers (markdown pipeline, ws bridge)
    tsconfig.json           # Path alias @cli/* → ../../src/*
    next.config.ts          # output: 'standalone'
    package.json            # next + react as devDependencies only

tests/                      # Vitest tests mirroring src/ structure
dist/                       # Build output (published)
  viewer/                   # Standalone viewer bundle (published)
```

## 5. Runtime Architecture

### CLI Invocation Path

```
User shell
  → node dist/bin/primitiv.js <command> [args]
  → src/cli.ts (Commander setup)
  → src/commands/<command>.ts (handler)
  → src/engine/<Manager>.ts (domain operation)
  → gray-matter + fs (read/write .primitiv/)
  → src/ui/* (format result)
  → stdout / stderr
```

Every command follows this shape. Command handlers are thin — they parse options, call engine methods, and format output. All business logic lives in the engine layer.

### Viewer Invocation Path (SPEC-013)

```
User shell
  → primitiv view [--port N] [--no-open]
  → src/commands/view.ts
  → spawn node dist/viewer/server.js (with PRIMITIV_PROJECT_ROOT=cwd)
  → Next.js standalone server (bound to 127.0.0.1)
  → Browser opens http://localhost:<port>/
  → Server Component route
  → @cli/engine/<Manager> (via tsconfig path alias)
  → gray-matter + fs (read .primitiv/)
  → react-markdown + remark-gfm render
  → HTML response
```

In parallel, a `chokidar` watcher and a WebSocket server run inside the same Node process. File change events under `.primitiv/**` are debounced 200ms and broadcast as `refresh` messages; a thin client-side component calls `router.refresh()` on receipt.

## 6. Data Flow & Storage

All persistent state lives on the user's filesystem, under `.primitiv/` in the working directory. There is no database, no cache, no server-side state. Every CLI invocation reads fresh from disk.

| Path | Contents |
|---|---|
| `.primitiv/.state.json` | Project metadata: `nextSpecId`, `mode`, `primitivVersion`, etc. |
| `.primitiv/gates/*.md` | Company and security principles (YAML frontmatter + markdown) |
| `.primitiv/constitutions/*.md` | Product, development, architecture constitutions |
| `.primitiv/specs/SPEC-XXX-<slug>/` | One directory per spec |
| `.primitiv/specs/SPEC-XXX-<slug>/spec.md` | Required — the spec itself |
| `.primitiv/specs/SPEC-XXX-<slug>/clarifications.md` | Optional Q&A record |
| `.primitiv/specs/SPEC-XXX-<slug>/plan.md` | Optional technical plan |
| `.primitiv/specs/SPEC-XXX-<slug>/tasks.md` | Optional implementation tasks |
| `.primitiv/specs/SPEC-XXX-<slug>/test-results.md` | Optional test output |
| `.primitiv/specs/SPEC-XXX-<slug>/research.md` | Optional research notes |
| `.primitiv/specs/SPEC-XXX-<slug>/checklists/` | Optional review checklists |
| `.primitiv/specs/SPEC-XXX-<slug>/data-model/` | Optional schema sketches |
| `.primitiv/learnings/*.md` | Optional learnings (informational / important) |

The filesystem layout is part of the CLI's public contract. Changes require a migration path via `primitiv upgrade` and a corresponding entry in `MigrationManager`.

## 7. Engine Layer Design Rules

The engine layer is the most important boundary in the codebase. It is the reuse seam between the CLI commands and the viewer (ADR-003), and the containment layer for all domain logic.

**Rules:**

- **Node-runtime compatible only.** Engines must run in plain Node and inside a Next.js Server Component. No DOM APIs, no `window`, no Node-specific globals that fail inside RSC.
- **Pure with respect to CLI output.** Engines do not call `console.log`, `chalk`, `clack`, or any UI library. They return typed data; formatting is a command-layer concern.
- **All inputs validated with Zod.** Every engine method that accepts external data validates with a Zod schema declared in `src/schemas/`. Types are derived via `z.infer<>`.
- **All errors are thrown or returned as typed results.** Silent failure is banned by the development constitution; engines either throw (for exceptional conditions) or return `{ success, data?, error? }` shapes (for expected failure modes).
- **Idempotent file writes.** Engines that write to `.primitiv/` must be safe to re-run. Write operations check current state before overwriting.
- **No cross-engine calls without injection.** If `SpecManager` needs `GateManager`, the dependency is passed in via constructor or method parameter, not imported directly. This keeps the testing surface clean and prevents hidden coupling.

## 8. Viewer Design Rules

The viewer (`apps/viewer/`) is a first-class citizen of this constitution, but it is deliberately minimal.

**Rules:**

- **Read-only.** Never writes to `.primitiv/`. No forms, no Server Actions that mutate, no API routes that accept `POST`.
- **Server Components by default.** Client components (`"use client"`) are only used for the live-reload WebSocket bridge and for client-side search/filter on the specs list.
- **Engine imports via path alias.** `apps/viewer/tsconfig.json` declares `@cli/*` → `../../src/*`. Viewer code imports engine classes from `@cli/engine/*`. Direct relative imports into `../../src/` are forbidden (always use the alias).
- **Loopback bind only.** The Next.js standalone server binds to `127.0.0.1`. This is enforced in the spawn configuration inside `src/commands/view.ts` and verified by integration tests.
- **No logging of file contents.** `.primitiv/` files may contain sensitive context; log only paths, counts, and timings.
- **Prebuilt ship format.** Always published as a standalone bundle under `dist/viewer/`. `next` and `react` never appear as runtime dependencies of the root `primitiv` package.
- **Stack discipline.** Next.js 16 App Router, shadcn/ui + Radix, Tailwind CSS, TypeScript strict, Zod, react-markdown + remark-gfm, chokidar + ws. Additions require an ADR.

## 9. Schema Layer as Source of Truth

All types in the codebase originate from Zod schemas in `src/schemas/`. TypeScript interfaces are derived via `z.infer<typeof schema>` and never hand-duplicated. This single source of truth prevents drift between runtime validation and compile-time types.

Schemas cover: spec frontmatter, gate frontmatter, constitution frontmatter, learning frontmatter, state file, governance context, normalized constraints, CLI command options, and file layout expectations.

## 10. State Machine

Spec lifecycle states and transitions are defined once, in `src/state/specStateMachine.ts`, and consumed everywhere else (commands, engines, validation). The canonical states are:

`draft → gate-1-passed → gate-2-passed → gate-3-passed → clarified → planned → tasked → implementing → tested → reviewed → completed`

Internal status names include `gate-1-passed` and `gate-2-passed` for historical reasons (SPEC-012) — the corresponding slash commands were renamed to descriptive names, but the status identifiers are stored data and remain stable.

The state machine rejects invalid transitions at the engine layer. Command handlers do not bypass it.

## 11. Build, Publish, and Distribution

**Development:**
- `npm run build` → `tsc --build` produces `dist/` for local runs
- `npm run dev` → `tsc --watch`
- `npm test` → `vitest run`
- Viewer dev: `cd apps/viewer && npm run dev` (direct, not through `primitiv view`)

**Publishing:**
- `npm run build:publish` → `esbuild` bundles CLI to `dist/`
- `apps/viewer` is built with `next build` (standalone output) and copied to `dist/viewer/`
- `prepublishOnly` runs both builds
- The `files` array in `package.json` ships `dist/` (including `dist/viewer/`) and `templates/`

**Distribution targets:**
- Primary: `npm install -g primitiv` — global CLI
- Secondary: `npx primitiv <command>` — no install needed

The published tarball is the only distribution artifact. No Docker image, no binary build, no separate installer. Portability is guaranteed by Node ≥ 18 and nothing else.

## 12. Testing Architecture

Tests live under `tests/` mirroring `src/`. The testing strategy follows the development constitution's TDD mandate.

- **Unit tests (Vitest):** Engine class methods, Zod schemas, utilities, state machine transitions. Use `memfs` for filesystem isolation — tests never touch the real disk.
- **Integration tests (Vitest):** End-to-end CLI command runs against a virtual `.primitiv/` tree. Command handlers exercised via `src/cli.ts`.
- **Viewer tests (Vitest + Playwright, once SPEC-013 lands):** Server Component rendering against a fixture `.primitiv/`; Playwright E2E against a spawned standalone server.
- **No mocked engines in integration tests.** If a command integrates with an engine, the real engine runs against `memfs` — consistent with the development constitution's "no mocking the database" rule, translated to the CLI's filesystem-as-database reality.

## 13. Per-Spec Tech Stack Log

- N/A (no infrastructure changes — CLI tooling only) (SPEC-001)
- N/A (no infrastructure changes — pipeline command updates only) (SPEC-002)
- N/A (no infrastructure changes — new MigrationManager module, CLI command, Zod schemas, slash command) (SPEC-003)
- N/A (no infrastructure changes — template-only update to primitiv.clarify command) (SPEC-004)
- N/A (no infrastructure changes — new GovernanceCompiler engine class, GovernanceContextSchema, primitiv compile CLI command, slash command template, downstream template updates; node:crypto built-in only) (SPEC-005)
- N/A (no infrastructure changes — NormalizedConstraints schemas added to GovernanceContextSchema, deriveConstraints() method added to GovernanceCompiler, COMPILER_VERSION bumped to 1.1) (SPEC-006)
- N/A (no infrastructure changes — Gherkin BDD format in specify/plan/tasks/test-feature command templates, JSDoc on TaskItemSchema.acceptanceCriteria) (SPEC-007)
- @clack/prompts + gradient-string added; new src/ui/ module, install command, CI/CD workflows (.github/workflows/); GovernanceCompiler TS fix; package renamed primitiv v1.0.0 (SPEC-008)
- N/A (no infrastructure changes — new LearningManager engine class, LearningFrontmatterSchema, learnings[] in GovernanceContext, primitiv learn CLI command, /primitiv.learn slash command, COMPILER_VERSION bumped to 1.2, learnings/ directory added to init) (SPEC-009)
- N/A (no infrastructure changes — primitiv upgrade replaces primitiv update; new src/utils/version.ts getPackageVersion(); primitivVersion added to StateFile; init flows stamp version; dynamic --version from package.json) (SPEC-010)
- N/A (no infrastructure changes — renamed gate-1/gate-2 commands to company-principles/security-principles; DEPRECATED_COMMANDS cleanup in upgrade; .primitiv/README.md regeneration) (SPEC-012)
- **SPEC-013**: Adds `apps/viewer/` — first embedded Next.js 16 App Router application. New runtime dependencies flow into `apps/viewer/package.json` only (next 16.2.3, react 19, tailwindcss 4, radix-ui umbrella, platform-mirrored UI primitives, react-markdown, remark-gfm, rehype-highlight, gray-matter, lucide-react, chokidar, ws — the latter two unused pending live-reload rework; **@xyflow/react + @dagrejs/dagre** for the task dependency graph; **@tailwindcss/typography + tw-animate-css** for prose rendering and dialog transitions). Root package gains `open ^10` and a `build:viewer` script. Published tarball grows by the standalone bundle (~40MB) under `dist/viewer/`. New root CLI command `primitiv view --port <n> --no-open`. Engine layer gains a reuse seam (ADR-003) via tsconfig path alias `@cli/* → ../../dist/src/*` — the viewer imports compiled `.js` because Turbopack cannot rewrite `.js` specifiers to `.ts` source; `esbuild.config.js` now runs full `tsc` before the viewer build so `dist/src/**/*.js` exists. `SpecManager` gains a non-destructive `listWithErrors()` method and an enriched `getSpecGraph()` return with `research`, `checklistFiles`, `dataModelFiles`. Architecture constitution amended to v2 to reflect that this repo is the CLI, not the Platform (ADR-001). Viewer UX adopts the primitiv-platform's M3 dark design tokens (oklch palette with tertiary/surface/inverse/outline tokens), Inter + Clash Display fonts, full-width layout, collapsible metadata panels via native `<details>`, Kanban board and React Flow dependency graph for the Tasks tab with a shared Jira-style detail modal. **Live reload deferred**: the custom `apps/viewer/server.ts` with chokidar + ws broke on Next.js 16 standalone (webpack-lib resolution); the viewer ships with Next.js's default standalone `server.js` and all routes set to `force-dynamic` so manual browser refresh picks up every change. Follow-up spec will re-add live reload via a Server Sent Events Route Handler.
