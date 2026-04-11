---
type: tasks
version: 1
specId: SPEC-013
tasks:
  - id: TASK-001
    title: "Extend SpecManager with listWithErrors and enriched spec graph"
    description: "Add a new `listWithErrors()` method to SpecManager that returns both successfully-parsed specs and a separate array of parse errors (instead of silently skipping malformed specs as list() does today). Extend getSpecGraph() to include research.md parsed content (when present) and raw clarifications.md content. These additions are backward-compatible: the existing list() and getSpecGraph() consumers continue to work unchanged. Write unit tests against memfs fixtures that include one valid spec and one malformed spec."
    status: pending
    files:
      - "src/engine/SpecManager.ts"
      - "tests/engine/SpecManager.test.ts"
    acceptanceCriteria:
      - "Feature: Specs List > Scenario: Specs list shows every spec on disk"
      - "Feature: Graceful Handling of Malformed Files > Scenario: Malformed file still appears in list views"
      - "Feature: Spec Detail With Artifacts > Scenario Outline: Spec detail exposes each artifact as a tab"
    dependsOn: []

  - id: TASK-002
    title: "Implement `primitiv view` CLI command"
    description: "Create src/commands/view.ts implementing the full CLI surface for `primitiv view`: validates `.primitiv/` exists (friendly NotInitializedError otherwise), attempts to bind the requested port and translates EADDRINUSE into a clear error with a --port suggestion, spawns `node dist/viewer/server.js` with PRIMITIV_PROJECT_ROOT / PORT / HOST=127.0.0.1 env, waits for a `VIEWER_READY` sentinel line on child stdout, opens the default browser via the `open` npm package unless --no-open, forwards SIGINT/SIGTERM to the child and exits cleanly. Register in src/cli.ts with options `--port <number>` (default 3141) and `--no-open`. Add `open` to root package.json dependencies; remove the self-referential `primitiv` dependency noted in package.json:53. Integration test spawns the command against a tmp project, hits GET /, asserts 200, then SIGTERMs. Also tests the port-in-use and no-project failure modes. NOTE: the integration test can use a stub server.js during this task — TASK-015 and TASK-016 wire the real viewer bundle in."
    status: pending
    files:
      - "src/commands/view.ts"
      - "src/cli.ts"
      - "package.json"
      - "tests/commands/view.test.ts"
    acceptanceCriteria:
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view` starts on the default port"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view --port` overrides the default port"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view` outside a Primitiv project fails clearly"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view --no-open` suppresses browser launch"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view` fails clearly when the port is already bound"
    dependsOn: []

  - id: TASK-003
    title: "Scaffold apps/viewer/ Next.js 16 project"
    description: "Create the apps/viewer/ directory with a minimal Next.js 16 App Router project: package.json (devDeps: next, react, react-dom, typescript, @types/*, tailwindcss, postcss, autoprefixer; deps: react-markdown, remark-gfm, rehype-highlight, clsx, class-variance-authority, lucide-react, tailwind-merge, chokidar, ws, @types/ws), tsconfig.json with strict mode and paths `{ '@/*': ['./*'], '@cli/*': ['../../src/*'] }`, next.config.ts with `output: 'standalone'` and `outputFileTracingRoot` set to the repo root, postcss.config.mjs, tailwind.config.ts (darkMode: 'class', content globs covering app/, components/, lib/, and ../../src/engine/), components.json for shadcn, .gitignore, next-env.d.ts, app/globals.css with Tailwind directives and shadcn CSS variables. `npm run build` inside apps/viewer/ must succeed against a placeholder `app/page.tsx` that renders 'viewer scaffold ok'."
    status: pending
    files:
      - "apps/viewer/package.json"
      - "apps/viewer/tsconfig.json"
      - "apps/viewer/next.config.ts"
      - "apps/viewer/postcss.config.mjs"
      - "apps/viewer/tailwind.config.ts"
      - "apps/viewer/components.json"
      - "apps/viewer/.gitignore"
      - "apps/viewer/next-env.d.ts"
      - "apps/viewer/app/globals.css"
      - "apps/viewer/app/page.tsx"
    acceptanceCriteria:
      - "Feature: Dashboard Overview > Scenario: Dashboard loads for a populated project"
    dependsOn: []

  - id: TASK-004
    title: "Create E2E test fixture `.primitiv/` tree"
    description: "Build a minimal but representative fixture directory at apps/viewer/tests/fixtures/.primitiv/ containing: .state.json, gates/company-principles.md, gates/security-principles.md, constitutions/product.md + development.md + architecture.md, and three spec directories: SPEC-001-sample-good with spec.md + plan.md + tasks.md + clarifications.md + test-results.md (to exercise tabs), SPEC-002-sample-minimal with just spec.md, SPEC-003-sample-malformed with broken YAML frontmatter. Each markdown file has realistic minimal content the tests can assert against. Fixture content is committed and reused by both viewer unit tests and Playwright E2E tests."
    status: pending
    files:
      - "apps/viewer/tests/fixtures/.primitiv/.state.json"
      - "apps/viewer/tests/fixtures/.primitiv/gates/company-principles.md"
      - "apps/viewer/tests/fixtures/.primitiv/gates/security-principles.md"
      - "apps/viewer/tests/fixtures/.primitiv/constitutions/product.md"
      - "apps/viewer/tests/fixtures/.primitiv/constitutions/development.md"
      - "apps/viewer/tests/fixtures/.primitiv/constitutions/architecture.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-001-sample-good/spec.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-001-sample-good/plan.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-001-sample-good/tasks.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-001-sample-good/clarifications.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-001-sample-good/test-results.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-002-sample-minimal/spec.md"
      - "apps/viewer/tests/fixtures/.primitiv/specs/SPEC-003-sample-malformed/spec.md"
    acceptanceCriteria:
      - "Feature: Graceful Handling of Malformed Files > Scenario: Malformed file still appears in list views"
      - "Feature: Spec Detail With Artifacts > Scenario Outline: Spec detail exposes each artifact as a tab"
    dependsOn: []

  - id: TASK-005
    title: "Install shadcn/ui primitives into apps/viewer"
    description: "Run shadcn CLI to add the components used by the viewer: button, card, table, tabs, badge, alert, input, separator. Create apps/viewer/lib/utils.ts with the standard `cn()` helper. Verify dark theme renders correctly by rendering a single button + card on the scaffold page. Commit the generated component files per shadcn convention (components are owned by the project, not imported from a package)."
    status: pending
    files:
      - "apps/viewer/components/ui/button.tsx"
      - "apps/viewer/components/ui/card.tsx"
      - "apps/viewer/components/ui/table.tsx"
      - "apps/viewer/components/ui/tabs.tsx"
      - "apps/viewer/components/ui/badge.tsx"
      - "apps/viewer/components/ui/alert.tsx"
      - "apps/viewer/components/ui/input.tsx"
      - "apps/viewer/components/ui/separator.tsx"
      - "apps/viewer/lib/utils.ts"
    acceptanceCriteria:
      - "Feature: Dashboard Overview > Scenario: Dashboard loads for a populated project"
    dependsOn: ["TASK-003"]

  - id: TASK-006
    title: "Viewer core lib: project root, engine singleton, markdown pipeline"
    description: "Create apps/viewer/lib/project-root.ts (reads PRIMITIV_PROJECT_ROOT env, throws typed error if missing), apps/viewer/lib/engine.ts (module-level cache keyed by project root, lazy `getEngine()` calling `PrimitivEngine.load()` imported via @cli/engine/PrimitivEngine), apps/viewer/lib/markdown.ts (configured react-markdown plugin array and component override map: cards for Feature/Scenario/Background/Scenario Outline headings, keyword highlighting for Given/When/Then/And/But). Write apps/viewer/tests/unit/markdown.test.ts asserting the Gherkin override produces the expected HTML structure for a fixture markdown string. Verify that the @cli/* path alias resolves correctly inside a Next.js build."
    status: pending
    files:
      - "apps/viewer/lib/project-root.ts"
      - "apps/viewer/lib/engine.ts"
      - "apps/viewer/lib/markdown.ts"
      - "apps/viewer/tests/unit/markdown.test.ts"
    acceptanceCriteria:
      - "Feature: Spec Detail With Artifacts > Scenario: Gherkin acceptance criteria are rendered readably"
    dependsOn: ["TASK-003"]

  - id: TASK-007
    title: "Viewer data loaders"
    description: "Create apps/viewer/lib/load-dashboard.ts (spec counts by status, gate and constitution presence), load-specs.ts (uses the new SpecManager.listWithErrors() from TASK-001), load-spec-detail.ts (calls getSpecGraph, returns a discriminated union for the malformed-frontmatter case), load-gate.ts, load-constitution.ts, load-learnings.ts (gracefully handles missing learnings directory). All loaders import PrimitivEngine via the `getEngine()` singleton from TASK-006 and wrap engine calls in try/catch to surface parse errors rather than swallowing them. Write apps/viewer/tests/unit/load-specs.test.ts against the fixture tree from TASK-004 asserting that load-specs returns both valid rows and the malformed row with a parse error marker."
    status: pending
    files:
      - "apps/viewer/lib/load-dashboard.ts"
      - "apps/viewer/lib/load-specs.ts"
      - "apps/viewer/lib/load-spec-detail.ts"
      - "apps/viewer/lib/load-gate.ts"
      - "apps/viewer/lib/load-constitution.ts"
      - "apps/viewer/lib/load-learnings.ts"
      - "apps/viewer/tests/unit/load-specs.test.ts"
    acceptanceCriteria:
      - "Feature: Dashboard Overview > Scenario: Dashboard loads for a populated project"
      - "Feature: Dashboard Overview > Scenario: Dashboard handles missing artifacts gracefully"
      - "Feature: Specs List > Scenario: Specs list shows every spec on disk"
      - "Feature: Specs List > Scenario: Specs list empty state"
      - "Feature: Graceful Handling of Malformed Files > Scenario: Malformed frontmatter renders body with a warning banner"
      - "Feature: Graceful Handling of Malformed Files > Scenario: Malformed file still appears in list views"
    dependsOn: ["TASK-001", "TASK-006"]

  - id: TASK-008
    title: "Shared viewer components"
    description: "Create the viewer's reusable components. Server Components: sidebar.tsx (top-level navigation with lucide icons), status-badge.tsx (color-coded SpecStatus badge mirroring the chalk colors from src/commands/status.ts), frontmatter-panel.tsx (recursive YAML key/value renderer), markdown-renderer.tsx (wraps react-markdown with the pipeline from TASK-006), warning-banner.tsx (shadcn Alert rendering parse errors). Client Components (`use client`): sidebar-link.tsx (usePathname active state), specs-table.tsx (shadcn Table with sortable headers + Input filter), live-reload-client.tsx (opens ws://, reconnects with exponential backoff, calls router.refresh() on 'refresh' messages, renders nothing)."
    status: pending
    files:
      - "apps/viewer/components/sidebar.tsx"
      - "apps/viewer/components/sidebar-link.tsx"
      - "apps/viewer/components/status-badge.tsx"
      - "apps/viewer/components/frontmatter-panel.tsx"
      - "apps/viewer/components/markdown-renderer.tsx"
      - "apps/viewer/components/warning-banner.tsx"
      - "apps/viewer/components/live-reload-client.tsx"
      - "apps/viewer/components/specs-table.tsx"
    acceptanceCriteria:
      - "Feature: Spec Detail With Artifacts > Scenario: Gherkin acceptance criteria are rendered readably"
      - "Feature: Specs List > Scenario: Specs list filters by search query"
      - "Feature: Graceful Handling of Malformed Files > Scenario: Malformed frontmatter renders body with a warning banner"
      - "Feature: Live Reload > Scenario: WebSocket disconnect does not break the page"
    dependsOn: ["TASK-005", "TASK-006"]

  - id: TASK-009
    title: "Root layout, error boundary, and not-found page"
    description: "Create apps/viewer/app/layout.tsx (Server Component, loads Lato via next/font/google, applies dark theme class on <html>, renders <Sidebar /> and <LiveReloadClient /> alongside children), apps/viewer/app/error.tsx (client error boundary with retry button, logs to console — aligns with 'no silent failures' dev-constitution rule), apps/viewer/app/not-found.tsx (friendly 404 linking back to dashboard). Replace the scaffold placeholder app/page.tsx only after TASK-010."
    status: pending
    files:
      - "apps/viewer/app/layout.tsx"
      - "apps/viewer/app/error.tsx"
      - "apps/viewer/app/not-found.tsx"
    acceptanceCriteria:
      - "Feature: Live Reload > Scenario: WebSocket disconnect does not break the page"
    dependsOn: ["TASK-008"]

  - id: TASK-010
    title: "Dashboard route"
    description: "Replace the scaffold apps/viewer/app/page.tsx with the real dashboard. Server Component calls load-dashboard from TASK-007 and renders: total spec count, per-status breakdown using StatusBadge, gate presence badges (company/security), constitution presence badges (product/development/architecture). Handles the missing-artifacts case with 'Not defined' badges."
    status: pending
    files:
      - "apps/viewer/app/page.tsx"
    acceptanceCriteria:
      - "Feature: Dashboard Overview > Scenario: Dashboard loads for a populated project"
      - "Feature: Dashboard Overview > Scenario: Dashboard handles missing artifacts gracefully"
    dependsOn: ["TASK-007", "TASK-008", "TASK-009"]

  - id: TASK-011
    title: "Specs list and spec detail routes"
    description: "Create apps/viewer/app/specs/page.tsx (Server Component calling load-specs, passes rows into client-side SpecsTable, renders parse-error banner if any, empty state when no specs) and apps/viewer/app/specs/[id]/page.tsx (Server Component calling load-spec-detail, renders FrontmatterPanel + WarningBanner when parseError + shadcn Tabs built dynamically from the graph's non-null artifacts, each tab content rendered via MarkdownRenderer). Missing artifacts must not appear as tabs."
    status: pending
    files:
      - "apps/viewer/app/specs/page.tsx"
      - "apps/viewer/app/specs/[id]/page.tsx"
    acceptanceCriteria:
      - "Feature: Specs List > Scenario: Specs list shows every spec on disk"
      - "Feature: Specs List > Scenario: Specs list filters by search query"
      - "Feature: Specs List > Scenario: Specs list empty state"
      - "Feature: Spec Detail With Artifacts > Scenario: Spec detail shows the spec body and metadata"
      - "Feature: Spec Detail With Artifacts > Scenario Outline: Spec detail exposes each artifact as a tab"
      - "Feature: Spec Detail With Artifacts > Scenario: Missing artifacts do not appear as tabs"
      - "Feature: Spec Detail With Artifacts > Scenario: Gherkin acceptance criteria are rendered readably"
      - "Feature: Graceful Handling of Malformed Files > Scenario: Malformed frontmatter renders body with a warning banner"
    dependsOn: ["TASK-007", "TASK-008", "TASK-009"]

  - id: TASK-012
    title: "Gates routes"
    description: "Create apps/viewer/app/gates/page.tsx (Server Component listing two gates with presence badges) and apps/viewer/app/gates/[name]/page.tsx (Server Component validating `name` as 'company-principles' | 'security-principles' via Zod, calling load-gate, rendering FrontmatterPanel + MarkdownRenderer, WarningBanner when parseError)."
    status: pending
    files:
      - "apps/viewer/app/gates/page.tsx"
      - "apps/viewer/app/gates/[name]/page.tsx"
    acceptanceCriteria:
      - "Feature: Gates Viewer > Scenario: Gates index lists both gates"
      - "Feature: Gates Viewer > Scenario: Gate detail renders frontmatter and body"
    dependsOn: ["TASK-007", "TASK-008", "TASK-009"]

  - id: TASK-013
    title: "Constitutions routes"
    description: "Create apps/viewer/app/constitutions/page.tsx (lists product, development, architecture) and apps/viewer/app/constitutions/[name]/page.tsx (Zod-validated param, calls load-constitution, renders FrontmatterPanel + MarkdownRenderer, WarningBanner when parseError)."
    status: pending
    files:
      - "apps/viewer/app/constitutions/page.tsx"
      - "apps/viewer/app/constitutions/[name]/page.tsx"
    acceptanceCriteria:
      - "Feature: Constitutions Viewer > Scenario: Constitutions index lists all three"
      - "Feature: Constitutions Viewer > Scenario: Constitution detail renders frontmatter and body"
    dependsOn: ["TASK-007", "TASK-008", "TASK-009"]

  - id: TASK-014
    title: "Learnings routes"
    description: "Create apps/viewer/app/learnings/page.tsx (Server Component calling load-learnings; friendly empty state 'No learnings recorded yet — run /primitiv.learn to add one' when the directory is absent) and apps/viewer/app/learnings/[id]/page.tsx (Zod-validated param, renders a single learning via FrontmatterPanel + MarkdownRenderer). Per the clarification, the sidebar entry stays visible regardless of whether the directory exists."
    status: pending
    files:
      - "apps/viewer/app/learnings/page.tsx"
      - "apps/viewer/app/learnings/[id]/page.tsx"
    acceptanceCriteria:
      - "Feature: Dashboard Overview > Scenario: Dashboard handles missing artifacts gracefully"
    dependsOn: ["TASK-007", "TASK-008", "TASK-009"]

  - id: TASK-015
    title: "Custom Next.js server with chokidar + WebSocket live reload"
    description: "Create apps/viewer/server.ts: boots Next.js programmatically in production mode, mounts an HTTP server bound to 127.0.0.1 on the PORT env, attaches a ws.Server to the same HTTP server, starts chokidar watching `${PRIMITIV_PROJECT_ROOT}/.primitiv/**` with 200ms debounce, broadcasts `{type:'refresh'}` on debounced change events. Prints `VIEWER_READY http://127.0.0.1:<port>` on listen so the CLI parent knows when to open the browser. Handles SIGINT/SIGTERM by closing Next.js, the WebSocket server, and chokidar cleanly then exiting 0. The WebSocket protocol and the client behavior (implemented in TASK-008) agree on a single message shape: `{type:'refresh'}`."
    status: pending
    files:
      - "apps/viewer/server.ts"
    acceptanceCriteria:
      - "Feature: Live Reload > Scenario: Editing a spec file refreshes the open spec detail page"
      - "Feature: Live Reload > Scenario: Adding a new spec updates the specs list without refresh"
      - "Feature: Live Reload > Scenario: Burst writes produce a single refresh"
      - "Feature: Live Reload > Scenario: WebSocket disconnect does not break the page"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view` starts on the default port"
    dependsOn: ["TASK-003"]

  - id: TASK-016
    title: "Publish pipeline: build viewer into dist/viewer/ and ship in tarball"
    description: "Wire the viewer build into the root publish pipeline. Modify esbuild.config.js to run `next build` against apps/viewer/ after the CLI bundle completes. Create apps/viewer/scripts/copy-standalone.ts invoked by the root pipeline: copies apps/viewer/.next/standalone/ + apps/viewer/.next/static/ + apps/viewer/public/ into dist/viewer/, replacing the Next.js-generated server.js with the compiled custom server.js from TASK-015. Update root package.json: add `build:viewer` and `clean:viewer` scripts, wire `build:viewer` into `prepublishOnly`, add `dist/viewer/**` to the `files` array. Update .gitignore to exclude apps/viewer/.next/, apps/viewer/node_modules/, dist/viewer/. Smoke test: run `npm pack`, extract the tarball into a tmp dir, install it, cd into a fixture project, run `primitiv view --no-open --port <free>`, assert VIEWER_READY on stdout, hit GET /, SIGTERM, assert clean exit."
    status: pending
    files:
      - "package.json"
      - "esbuild.config.js"
      - "apps/viewer/scripts/copy-standalone.ts"
      - ".gitignore"
      - "tests/publish/viewer-smoke.test.ts"
    acceptanceCriteria:
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view` starts on the default port"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view --port` overrides the default port"
      - "Feature: CLI Launches The Viewer > Scenario: `primitiv view --no-open` suppresses browser launch"
    dependsOn: ["TASK-002", "TASK-003", "TASK-015"]

  - id: TASK-017
    title: "Playwright E2E tests"
    description: "Add Playwright to apps/viewer/devDependencies and create apps/viewer/playwright.config.ts pointing at the fixture from TASK-004. Tests: dashboard.spec.ts (loads /, asserts spec count and badges), specs.spec.ts (loads /specs, filters by 'sample', asserts rows; opens /specs/SPEC-001-sample-good, cycles through all tabs, asserts tasks.md content on the Tasks tab), live-reload.spec.ts (loads /specs/SPEC-001-sample-good, writes a marker string into the fixture spec.md via fs.promises, waits up to 500ms, asserts the marker appears). Each test spawns `node dist/viewer/server.js` with PRIMITIV_PROJECT_ROOT pointed at the fixture tree; tests tear down the server in afterAll. Tests run against the copied standalone bundle (TASK-016), not the dev server — this is what end users ship."
    status: pending
    files:
      - "apps/viewer/playwright.config.ts"
      - "apps/viewer/tests/e2e/dashboard.spec.ts"
      - "apps/viewer/tests/e2e/specs.spec.ts"
      - "apps/viewer/tests/e2e/live-reload.spec.ts"
      - "apps/viewer/package.json"
    acceptanceCriteria:
      - "Feature: Dashboard Overview > Scenario: Dashboard loads for a populated project"
      - "Feature: Specs List > Scenario: Specs list shows every spec on disk"
      - "Feature: Specs List > Scenario: Specs list filters by search query"
      - "Feature: Spec Detail With Artifacts > Scenario Outline: Spec detail exposes each artifact as a tab"
      - "Feature: Live Reload > Scenario: Editing a spec file refreshes the open spec detail page"
      - "Feature: Live Reload > Scenario: Burst writes produce a single refresh"
    dependsOn: ["TASK-004", "TASK-010", "TASK-011", "TASK-012", "TASK-013", "TASK-014", "TASK-015", "TASK-016"]
updatedAt: "2026-04-11T14:00:00Z"
---

# Tasks — SPEC-013 Web Spec Viewer

## TASK-001 — Extend SpecManager with listWithErrors and enriched spec graph
**Depends on:** —
**Files:** `src/engine/SpecManager.ts`, `tests/engine/SpecManager.test.ts`

Add `listWithErrors()` returning both valid specs and parse errors. Extend `getSpecGraph()` to include research.md and raw clarifications. Keep existing `list()`/`getSpecGraph()` consumers working unchanged. Unit-tested against memfs fixtures (valid + malformed spec).

## TASK-002 — Implement `primitiv view` CLI command
**Depends on:** —
**Files:** `src/commands/view.ts`, `src/cli.ts`, `package.json`, `tests/commands/view.test.ts`

Validates `.primitiv/`, binds port (EADDRINUSE → clear error), spawns `node dist/viewer/server.js` with env, waits for `VIEWER_READY` stdout, opens browser (`open` package) unless `--no-open`, forwards signals. Integration test uses a stub server.js until TASK-016.

## TASK-003 — Scaffold apps/viewer/ Next.js 16 project
**Depends on:** —
**Files:** package.json / tsconfig.json / next.config.ts / postcss.config.mjs / tailwind.config.ts / components.json / .gitignore / next-env.d.ts / app/globals.css / app/page.tsx (placeholder)

Minimal Next.js 16 App Router app with `@cli/*` path alias into `../../src/*`, `output: 'standalone'`, dark-mode Tailwind, shadcn config. `npm run build` must succeed against a placeholder page.

## TASK-004 — Create E2E test fixture `.primitiv/` tree
**Depends on:** —
**Files:** `apps/viewer/tests/fixtures/.primitiv/**`

Three specs (good/minimal/malformed), both gates, all three constitutions, state.json. Reused by unit and E2E tests.

## TASK-005 — Install shadcn/ui primitives
**Depends on:** TASK-003
**Files:** `apps/viewer/components/ui/{button,card,table,tabs,badge,alert,input,separator}.tsx`, `apps/viewer/lib/utils.ts`

Added via shadcn CLI, committed to the repo.

## TASK-006 — Viewer core lib
**Depends on:** TASK-003
**Files:** `apps/viewer/lib/{project-root,engine,markdown}.ts`, `apps/viewer/tests/unit/markdown.test.ts`

Engine singleton, project-root env reader, configured react-markdown pipeline with Gherkin overrides. Unit-tested.

## TASK-007 — Viewer data loaders
**Depends on:** TASK-001, TASK-006
**Files:** `apps/viewer/lib/load-{dashboard,specs,spec-detail,gate,constitution,learnings}.ts`, `apps/viewer/tests/unit/load-specs.test.ts`

One loader per section. Uses `listWithErrors()`. Unit tests assert malformed specs surface as parse errors.

## TASK-008 — Shared viewer components
**Depends on:** TASK-005, TASK-006
**Files:** `apps/viewer/components/{sidebar,sidebar-link,status-badge,frontmatter-panel,markdown-renderer,warning-banner,live-reload-client,specs-table}.tsx`

Server Components for rendering + three client islands (sidebar-link, specs-table, live-reload-client). Live-reload client uses the `{type:'refresh'}` protocol from TASK-015.

## TASK-009 — Root layout, error boundary, not-found
**Depends on:** TASK-008
**Files:** `apps/viewer/app/{layout,error,not-found}.tsx`

Lato font, dark theme, sidebar + live-reload mount, client error boundary with retry.

## TASK-010 — Dashboard route
**Depends on:** TASK-007, TASK-008, TASK-009
**Files:** `apps/viewer/app/page.tsx`

Replaces the scaffold placeholder with the real dashboard.

## TASK-011 — Specs list and spec detail routes
**Depends on:** TASK-007, TASK-008, TASK-009
**Files:** `apps/viewer/app/specs/page.tsx`, `apps/viewer/app/specs/[id]/page.tsx`

List + dynamic-tabs detail page. Missing artifacts hide their tabs. Parse errors render as warning banner + raw body.

## TASK-012 — Gates routes
**Depends on:** TASK-007, TASK-008, TASK-009
**Files:** `apps/viewer/app/gates/page.tsx`, `apps/viewer/app/gates/[name]/page.tsx`

Two gates, Zod-validated param.

## TASK-013 — Constitutions routes
**Depends on:** TASK-007, TASK-008, TASK-009
**Files:** `apps/viewer/app/constitutions/page.tsx`, `apps/viewer/app/constitutions/[name]/page.tsx`

Three constitutions, Zod-validated param.

## TASK-014 — Learnings routes
**Depends on:** TASK-007, TASK-008, TASK-009
**Files:** `apps/viewer/app/learnings/page.tsx`, `apps/viewer/app/learnings/[id]/page.tsx`

Empty state when the directory is absent; sidebar link stays visible regardless.

## TASK-015 — Custom Next.js server with chokidar + WebSocket live reload
**Depends on:** TASK-003
**Files:** `apps/viewer/server.ts`

Programmatic Next.js boot + HTTP server on 127.0.0.1 + WebSocket server + chokidar watcher (200ms debounce) + `VIEWER_READY` sentinel + clean signal handling. Defines the `{type:'refresh'}` message contract.

## TASK-016 — Publish pipeline and tarball smoke test
**Depends on:** TASK-002, TASK-003, TASK-015
**Files:** `package.json`, `esbuild.config.js`, `apps/viewer/scripts/copy-standalone.ts`, `.gitignore`, `tests/publish/viewer-smoke.test.ts`

Wires `next build` + copy into `dist/viewer/` into the root publish pipeline, ships it via `files`, smoke-tests the packed tarball end-to-end through `primitiv view --no-open`.

## TASK-017 — Playwright E2E tests
**Depends on:** TASK-004, TASK-010, TASK-011, TASK-012, TASK-013, TASK-014, TASK-015, TASK-016
**Files:** `apps/viewer/playwright.config.ts`, `apps/viewer/tests/e2e/{dashboard,specs,live-reload}.spec.ts`, `apps/viewer/package.json`

Dashboard / specs / live-reload scenarios against the copied standalone bundle (not dev server).
