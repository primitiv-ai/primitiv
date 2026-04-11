---
type: spec
id: SPEC-013
title: "Web Spec Viewer"
status: completed
version: 6
branch: "spec/SPEC-013-web-spec-viewer"
author: "gh-prim"
createdAt: "2026-04-11T00:00:00Z"
updatedAt: "2026-04-11T23:45:00Z"
---

# SPEC-013: Web Spec Viewer

## Description

A read-only web interface that renders the `.primitiv/` directory of a Primitiv project — specs, their artifacts (clarifications, plans, tasks, test results, research), gates (company and security principles), and constitutions (product, development, architecture).

Today, every Primitiv artifact is a markdown file. Reading them requires opening `.primitiv/specs/SPEC-XXX-*/spec.md`, `plan.md`, `tasks.md`, etc. in an editor. For projects with many specs, browsing governance state in bulk is friction-heavy. A simple web viewer gives contributors, reviewers, and non-technical stakeholders a navigable surface over the governance files without asking them to know the directory layout.

Scope is intentionally narrow: **render what exists on disk**. No editing, no mutations, no authentication, no database. The viewer is a dev-local tool launched alongside a Primitiv project — not a hosted product.

## Current Behavior

Primitiv is a CLI-only project. There is no web application, no React code, and no Next.js setup anywhere in the repo.

- **No UI surface exists.** `src/` contains CLI entry points, engine classes, schemas, and state — no browser-facing code.
- **Governance files live on disk.** The filesystem is the source of truth:
  - `.primitiv/specs/SPEC-XXX-<slug>/` — one directory per spec, containing `spec.md` plus optional artifacts (`plan.md`, `tasks.md`, `clarifications.md`, `test-results.md`, `research.md`, `checklists/`, `data-model/`)
  - `.primitiv/gates/company-principles.md` and `.primitiv/gates/security-principles.md`
  - `.primitiv/constitutions/product.md`, `development.md`, `architecture.md`
  - `.primitiv/learnings/*.md` (optional)
  - `.primitiv/.state.json` — project metadata (`nextSpecId`, `mode`, `primitivVersion`)
- **Existing engines already parse these files.** `src/engine/SpecManager.ts`, `GateManager.ts`, `ConstitutionManager.ts`, `LearningManager.ts` each load and validate markdown + YAML frontmatter. The viewer should call these engines rather than re-implementing parsing.
- **Established CLI launch pattern.** Existing commands (`init`, `compile`, `status`, `upgrade`, `validate`, `learn`, `migrate`, `install`) are registered in `src/commands/` and wired through `src/cli.ts`. A new `primitiv view` command follows the same pattern.
- **Established stack** (from `.primitiv/constitutions/development.md` and `architecture.md`): TypeScript strict, Next.js 16 App Router, shadcn/ui + Radix + Tailwind CSS, Zod, Server Components by default, Lato font, dark mode primary.

## Proposed Changes

1. **New Next.js 16 app at `apps/viewer/`.**
   - App Router, Server Components by default, TypeScript strict
   - shadcn/ui + Radix + Tailwind CSS, dark mode primary, Lato font
   - `next.config.ts` sets `output: 'standalone'` for prebuilt shipping
   - Own `package.json`, `tsconfig.json`, `next.config.ts` — isolated from the CLI's compilation so Next.js build concerns do not leak into CLI compilation
   - Reads `.primitiv/` from the working directory of the process (passed via env var `PRIMITIV_PROJECT_ROOT`)
   - No database, no auth, no workflow engine — filesystem reads only

2. **Engine reuse via path alias.**
   - `apps/viewer/tsconfig.json` declares a path alias (e.g. `@cli/*` → `../../src/*`)
   - Viewer Server Components import `SpecManager`, `GateManager`, `ConstitutionManager`, `LearningManager` directly from `src/engine/`
   - Next.js `transpilePackages` (or equivalent) is configured to compile the out-of-tree imports
   - Single source of truth — no duplicated parsing logic

3. **Routes:**
   - `/` — Dashboard: spec count by status, gate presence badges, constitution presence badges
   - `/specs` — Specs list with sort and client-side search
   - `/specs/[id]` — Spec detail with tabs for each artifact present on disk
   - `/gates` — Index listing company-principles and security-principles
   - `/gates/[name]` — Rendered gate markdown + frontmatter panel
   - `/constitutions` — Index of product, development, architecture
   - `/constitutions/[name]` — Rendered constitution markdown + frontmatter panel
   - `/learnings` — Learnings list (with friendly empty state if the directory does not exist)
   - `/learnings/[id]` — Learning detail

4. **Markdown rendering:**
   - Parse frontmatter with `gray-matter` (already a CLI dependency)
   - Render markdown body with `react-markdown` + `remark-gfm` (Server-Component-friendly, works in RSC)
   - Custom component overrides style Gherkin `Feature:` / `Scenario:` / `Background:` / `Scenario Outline:` blocks as distinct cards, and highlight `Given` / `When` / `Then` / `And` / `But` as leading keywords
   - Syntax-highlight code blocks via a rehype plugin (Shiki or highlight.js — exact choice deferred to plan phase; no AC impact)
   - Render YAML frontmatter as a structured metadata panel alongside the body
   - Malformed frontmatter: loader returns `{ frontmatter: null, body: rawContents, parseError }`; the page renders the body and shows a visible warning banner with the parse error and file path

5. **Packaging — prebuilt standalone server.**
   - Publish pipeline runs `next build` against `apps/viewer/` and copies `.next/standalone/` + `.next/static/` + `public/` into `dist/viewer/` inside the published tarball
   - Root `package.json` `files` array includes `dist/viewer/`
   - `primitiv view` spawns `node dist/viewer/server.js`
   - No build runs on the user's machine; the viewer works fully offline
   - `next` and `react` live in `apps/viewer/package.json` devDependencies — not runtime deps of the root package (the standalone bundle inlines what it needs)

6. **CLI integration — `src/commands/view.ts`:**
   - Registered in `src/cli.ts` with help text: "View the current Primitiv project in a web browser (read-only)"
   - Starts the prebuilt production server; no `--dev` flag (viewer contributors run `npm run dev` inside `apps/viewer/` directly)
   - Default port `3141`; `--port <n>` overrides. If the port is already bound the command fails with a clear error — no automatic fallback
   - Binds to `127.0.0.1` only
   - Opens the default browser to `http://localhost:<port>/` by default; `--no-open` suppresses for headless / SSH / CI contexts. Browser-open failures log a warning but do not stop the server
   - URL always printed to stdout
   - Fails with a clear error if no `.primitiv/` directory is present in the working directory

7. **Live reload via filesystem watcher + WebSocket.**
   - The viewer process runs `chokidar` watching `.primitiv/**` and a WebSocket server alongside the Next.js standalone server
   - On change events (debounced 200ms to collapse burst writes from commands like `/primitiv.specify`), the WebSocket broadcasts a `refresh` message
   - A thin `"use client"` component mounted in the root layout opens the WebSocket on load and calls `router.refresh()` on receiving `refresh` — everything else stays server-rendered
   - Reconnection is attempted silently on server restart; WebSocket drop does not break the page
   - `chokidar` and a WebSocket library (`ws` or equivalent) become runtime dependencies of the viewer

8. **Navigation and UX:**
   - Left sidebar: Dashboard, Specs, Gates, Constitutions, Learnings (always visible)
   - Breadcrumbs on detail pages
   - Client-side search/filter on the specs list over the already-loaded dataset
   - Status badges color-coded by spec lifecycle state (`draft`, `gate-1-passed`, …, `completed`)

## Acceptance Criteria

### Feature: Dashboard Overview

Landing page gives a high-level snapshot of the project's governance state.

#### Scenario: Dashboard loads for a populated project
  Given a Primitiv project with specs, gates, and constitutions on disk
  When the user opens `/`
  Then the dashboard shows the total number of specs
  And it shows a breakdown of specs by status
  And it shows a "present" badge for company-principles.md
  And it shows a "present" badge for security-principles.md
  And it shows a "present" badge for each constitution file (product, development, architecture)

#### Scenario: Dashboard handles missing artifacts gracefully
  Given a Primitiv project with no gates defined
  When the user opens `/`
  Then the dashboard shows "Not defined" badges for company and security principles
  And no error is rendered

### Feature: Specs List

Browse all specs in the project.

#### Scenario: Specs list shows every spec on disk
  Given a project with 12 specs in `.primitiv/specs/`
  When the user opens `/specs`
  Then the page shows a table with 12 rows
  And each row shows the spec ID, title, status, branch, and updatedAt
  And the table is sortable by ID and by status

#### Scenario: Specs list filters by search query
  Given the user is on the specs list page
  When the user types "gherkin" into the search input
  Then only specs whose title or ID contain "gherkin" remain visible

#### Scenario: Specs list empty state
  Given a Primitiv project with no specs
  When the user opens `/specs`
  Then the page shows an empty state message

### Feature: Spec Detail With Artifacts

View a single spec and all of its artifacts.

#### Scenario: Spec detail shows the spec body and metadata
  Given a project containing SPEC-012
  When the user opens `/specs/SPEC-012`
  Then the frontmatter is rendered as a structured metadata panel
  And the markdown body is rendered as HTML
  And the page title contains "SPEC-012"

#### Scenario Outline: Spec detail exposes each artifact as a tab
  Given a project containing SPEC-001 with multiple artifacts
  When the user opens `/specs/SPEC-001`
  Then a tab labeled <tab> is visible
  And clicking the tab renders the content of <file>

  Examples:
  | tab             | file                |
  | Spec            | spec.md             |
  | Clarifications  | clarifications.md   |
  | Plan            | plan.md             |
  | Tasks           | tasks.md            |
  | Test Results    | test-results.md     |
  | Research        | research.md         |

#### Scenario: Missing artifacts do not appear as tabs
  Given SPEC-007 has spec.md, clarifications.md, plan.md, tasks.md on disk
  And SPEC-007 has no test-results.md
  When the user opens `/specs/SPEC-007`
  Then tabs are shown for Spec, Clarifications, Plan, and Tasks
  And no tab is shown for Test Results

#### Scenario: Gherkin acceptance criteria are rendered readably
  Given a spec whose body contains `#### Scenario:` blocks
  When the user views the spec detail page
  Then each Scenario block is visually distinguished from surrounding prose
  And Given/When/Then/And keywords are styled consistently

### Feature: Gates Viewer

View company and security principles.

#### Scenario: Gates index lists both gates
  Given a project with company-principles.md and security-principles.md on disk
  When the user opens `/gates`
  Then the page lists two entries: "Company Principles" and "Security Principles"
  And each entry links to its detail page

#### Scenario: Gate detail renders frontmatter and body
  Given the project's company-principles.md exists
  When the user opens `/gates/company-principles`
  Then the YAML frontmatter is rendered as a structured metadata panel
  And the markdown body is rendered as HTML

### Feature: Constitutions Viewer

View product, development, and architecture constitutions.

#### Scenario: Constitutions index lists all three
  Given a project with all three constitutions defined
  When the user opens `/constitutions`
  Then the page lists product, development, and architecture entries
  And each entry links to its detail page

#### Scenario: Constitution detail renders frontmatter and body
  Given the project's development constitution exists
  When the user opens `/constitutions/development`
  Then the dev-constitution frontmatter is rendered as a metadata panel
  And the markdown body is rendered as HTML

### Feature: CLI Launches The Viewer

A new `primitiv view` command starts the viewer pointed at the current project.

#### Scenario: `primitiv view` starts on the default port
  Given the user is in a Primitiv project directory
  When the user runs `primitiv view`
  Then the viewer starts on port 3141
  And the server binds to 127.0.0.1
  And the default browser opens `http://localhost:3141`
  And the dashboard reads from the current project's `.primitiv/` directory

#### Scenario: `primitiv view --port` overrides the default port
  Given the user is in a Primitiv project directory
  When the user runs `primitiv view --port 4200`
  Then the viewer starts on port 4200
  And the browser opens `http://localhost:4200`

#### Scenario: `primitiv view` outside a Primitiv project fails clearly
  Given the user is in a directory with no `.primitiv/` folder
  When the user runs `primitiv view`
  Then the command exits with a non-zero status
  And prints "Not a Primitiv project — run `primitiv init` first"

#### Scenario: `primitiv view --no-open` suppresses browser launch
  Given the user is in a Primitiv project directory
  When the user runs `primitiv view --no-open`
  Then the viewer starts on port 3141
  And the default browser is NOT opened
  And the URL `http://localhost:3141` is printed to stdout

#### Scenario: `primitiv view` fails clearly when the port is already bound
  Given port 3141 is already in use
  When the user runs `primitiv view`
  Then the command exits with a non-zero status
  And prints an error indicating the port is in use
  And suggests passing `--port <n>` to pick a different port

### Feature: Live Reload

The viewer reflects changes to `.primitiv/` without requiring a manual browser refresh.

#### Scenario: Editing a spec file refreshes the open spec detail page
  Given the viewer is running
  And the user's browser is on `/specs/SPEC-012`
  When a contributor edits `.primitiv/specs/SPEC-012-rename-gate-commands/spec.md` and saves
  Then within 500ms the browser re-renders the spec detail page
  And the new content is visible without a manual refresh

#### Scenario: Adding a new spec updates the specs list without refresh
  Given the viewer is running
  And the user's browser is on `/specs`
  When `/primitiv.specify` writes a new `.primitiv/specs/SPEC-014-*/spec.md` file
  Then within 500ms the specs list shows the new spec row

#### Scenario: Burst writes produce a single refresh
  Given the viewer is running
  And the user's browser is on any page
  When five files under `.primitiv/` are written within 100ms
  Then the page performs at most one refresh (events are debounced)

#### Scenario: WebSocket disconnect does not break the page
  Given the viewer is running and the live-reload WebSocket is connected
  When the viewer server is restarted
  Then the page continues to render the previously loaded content
  And the WebSocket client attempts to reconnect silently
  And no error overlay or broken state is shown to the user

### Feature: Graceful Handling of Malformed Files

Files with broken frontmatter remain viewable and the error is surfaced.

#### Scenario: Malformed frontmatter renders body with a warning banner
  Given a spec file whose YAML frontmatter fails to parse
  When the user opens that spec's detail page
  Then a warning banner is displayed at the top of the metadata panel
  And the banner lists the parse error and the file path
  And the markdown body is still rendered as HTML below the banner

#### Scenario: Malformed file still appears in list views
  Given a spec file with broken frontmatter
  When the user opens `/specs`
  Then the spec appears in the list (with "unknown" placeholders for missing metadata fields)
  And the row is visibly marked as having a parse error

## Test Strategy

- **Unit tests (Vitest):**
  - Data-loading wrappers around `SpecManager` / `GateManager` / `ConstitutionManager` for the viewer
  - Markdown → HTML helpers (Gherkin styling, frontmatter extraction)
  - Zod schemas for route params
- **Integration tests (Vitest):**
  - Server Components loading specs list and spec detail against a fixture `.primitiv/` tree
  - `primitiv view` CLI command — launches on a free port, responds on `/`, exits cleanly on SIGINT
- **E2E tests (Playwright):**
  - Dashboard counts match fixture content
  - Specs → SPEC-001 → Tasks tab renders tasks.md
  - Search filter narrows the spec list
- **UI/UX verification (Chrome DevTools MCP):**
  - Dark mode renders correctly as the primary theme
  - Responsive layout at mobile / tablet / desktop breakpoints
  - Keyboard navigation works on the sidebar and tabs

## Constraints

- **Read-only.** The MVP never writes to `.primitiv/`. No create/edit/delete of any governance file.
- **Local dev only.** Launched by a contributor on their own machine. Not for production hosting, multi-tenant deployment, or public exposure.
- **Bind to loopback only.** The server listens on `127.0.0.1`, never `0.0.0.0`, to prevent accidental LAN exposure.
- **No database, no auth, no workflow engine.** This is the CLI of Primitiv — not the Primitiv Platform. The architecture constitution is being amended in parallel to describe the CLI's architecture, including this viewer surface. The viewer is a filesystem-backed, single-process Next.js app with no DB, no auth, and no Temporal. This is the sanctioned stack, not a deviation.
- **Reuse existing engines via path alias.** The viewer imports `SpecManager`, `GateManager`, `ConstitutionManager`, `LearningManager` directly from `src/engine/`. No duplication of markdown/frontmatter parsing logic.
- **Do not log file contents.** `.primitiv/` files could in principle contain sensitive context; log only file paths and counts, never bodies.
- **Stack discipline.** Next.js 16 App Router, TypeScript strict, shadcn/ui + Radix, Tailwind, Zod, Server Components by default. `react-markdown` + `remark-gfm` for rendering. `chokidar` + `ws` (or equivalent) for live reload. No exceptions outside this set without another clarification round.
- **Packaging discipline.** `next` and `react` are devDependencies of `apps/viewer/`, never runtime deps of the root `primitiv` package. The published tarball ships a prebuilt standalone bundle under `dist/viewer/`.
- **Prerequisite.** The architecture constitution must be amended (`/primitiv.constitution architecture amend`) to describe the CLI's architecture before `/primitiv.plan` runs for this spec. The amended constitution must sanction the viewer's stack.

## Out of Scope

- Editing, creating, or deleting any governance file from the web UI
- Authentication, authorization, user accounts, multi-tenancy
- Hosting the viewer as a public or shared service
- Diff / history / git log over spec artifacts
- Running slash commands (`/primitiv.specify`, `/primitiv.plan`, etc.) from the web UI
- Visualizing governance compilation results or normalized constraints
- Writing a custom markdown renderer (use `react-markdown` + `remark-gfm`)
- Mobile-native experience (responsive web is sufficient)
- Development HMR through `primitiv view` (contributors run `npm run dev` inside `apps/viewer/` directly)
- Monorepo refactor (no `packages/core`; direct path alias from `apps/viewer/` into `src/`)
