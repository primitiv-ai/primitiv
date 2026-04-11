---
type: plan
version: 1
specId: SPEC-013
approach: "Add a Next.js 16 app at apps/viewer/ that imports existing engine classes from src/ via a tsconfig path alias, runs as a custom standalone server with chokidar+ws live reload, and is launched by a new `primitiv view` CLI command bundled as dist/viewer/ in the published tarball."
fileChanges:
  # --- Root package / build pipeline ---
  - path: "package.json"
    action: modify
    description: "Add `open` runtime dep for browser launch. Add `build:viewer` and `clean:viewer` scripts. Wire `build:viewer` into `prepublishOnly`. Include `dist/viewer/**` in the `files` array so it ships in the npm tarball. Remove the self-referential `primitiv` dependency noticed earlier."
  - path: "esbuild.config.js"
    action: modify
    description: "After CLI bundling, spawn `next build` in apps/viewer/ and copy .next/standalone/, .next/static/, and public/ into dist/viewer/. Fails the publish build if the viewer build fails."
  - path: ".gitignore"
    action: modify
    description: "Ignore apps/viewer/.next/, apps/viewer/node_modules/, dist/viewer/."
  # --- New CLI command ---
  - path: "src/commands/view.ts"
    action: create
    description: "Implements `primitiv view`. Validates `.primitiv/` exists via isPrimitivInitialized (exits with the spec's error message otherwise). Checks the port is free (explicit fail with suggestion to pass --port <n>). Spawns `node dist/viewer/server.js` with env PRIMITIV_PROJECT_ROOT, PORT, HOST=127.0.0.1. Reads a `VIEWER_READY` line from stdout, then opens the browser via `open` (unless --no-open). Forwards SIGINT/SIGTERM to the child. Logs the URL to stdout in all cases. — Feature: CLI Launches The Viewer > Scenarios: default port, --port override, outside project, --no-open, port-in-use."
  - path: "src/cli.ts"
    action: modify
    description: "Import and register `runView`. `primitiv view` command with options `--port <number>` (default 3141) and `--no-open` (boolean). Description string matches the amended architecture constitution boundary (read-only viewer)."
  # --- Engine extensions to support viewer ---
  - path: "src/engine/SpecManager.ts"
    action: modify
    description: "(1) Extend `getSpecGraph()` return shape with optional `research` (parsed via frontmatter.parseDocument) and `checklistFiles`/`dataModelFiles` (string[] paths). (2) Add new `listWithErrors()` method returning `{ ok: ParsedDocument<SpecFrontmatter>[]; errors: { dir: string; file: string; error: string }[] }` so the viewer can surface malformed files instead of silently skipping them. The existing `list()` stays backward-compatible for the CLI. — Feature: Specs List > Scenario: Specs list shows every spec; Feature: Graceful Handling of Malformed Files > Scenario: Malformed file still appears in list views."
  # --- apps/viewer scaffold ---
  - path: "apps/viewer/package.json"
    action: create
    description: "New package, not published independently. devDependencies: next, react, react-dom, typescript, @types/react, @types/node, tailwindcss, postcss, autoprefixer, eslint, eslint-config-next. dependencies: react-markdown, remark-gfm, rehype-highlight, clsx, class-variance-authority, lucide-react, tailwind-merge, chokidar, ws. Scripts: dev (next dev), build (next build), start (node server.js), lint."
  - path: "apps/viewer/tsconfig.json"
    action: create
    description: "Strict TS. baseUrl `.`, paths `{ '@/*': ['./*'], '@cli/*': ['../../src/*'] }`. Includes: next-env.d.ts, .next/types/**/*.ts, ./**/*.ts, ./**/*.tsx, ../../src/**/*.ts. noEmit true. jsx preserve. moduleResolution bundler."
  - path: "apps/viewer/next.config.ts"
    action: create
    description: "output: 'standalone'. transpilePackages: [] — explicit empty because imports from ../../src/* are handled via outputFileTracingRoot set to the repo root. eslint.ignoreDuringBuilds: false. Custom webpack config only if the path alias needs extra help resolving .js-suffixed imports from engine classes."
  - path: "apps/viewer/postcss.config.mjs"
    action: create
    description: "Standard Next.js + Tailwind postcss config."
  - path: "apps/viewer/tailwind.config.ts"
    action: create
    description: "Tailwind config targeting app/**, components/** and ../../src/engine/** (the last so any utility classes we leak from shared code still get compiled — paranoid but cheap). darkMode: 'class'. Theme tokens: CSS variables for shadcn colors, Lato font family."
  - path: "apps/viewer/components.json"
    action: create
    description: "shadcn/ui config. Style 'new-york', base color 'neutral', css variables, RSC: true, tsx: true, aliases @/components and @/lib."
  - path: "apps/viewer/.gitignore"
    action: create
    description: "Ignore .next/, node_modules/, *.log."
  - path: "apps/viewer/next-env.d.ts"
    action: create
    description: "Standard Next.js env type reference (generated file, committed for reproducibility)."
  # --- Server shell + live reload ---
  - path: "apps/viewer/server.ts"
    action: create
    description: "Custom Next.js server. Creates an HTTP server, boots Next.js in production mode via `next/dist/server/next` import, mounts a ws.Server on the same HTTP server, starts a chokidar watcher over `${PRIMITIV_PROJECT_ROOT}/.primitiv/**` with 200ms debounce broadcasting `{type:'refresh'}` to all WS clients. Binds to 127.0.0.1. Prints `VIEWER_READY http://127.0.0.1:<port>` on listen so the CLI parent can wait for readiness. Handles SIGINT/SIGTERM cleanly. — Feature: Live Reload > all scenarios; Feature: CLI Launches The Viewer > Scenarios: default port, loopback bind."
  - path: "apps/viewer/scripts/copy-standalone.ts"
    action: create
    description: "Post-build script invoked by the root esbuild pipeline. Copies .next/standalone/ (including package.json + node_modules) + .next/static/ + public/ + the compiled server.js into ../../dist/viewer/. Ensures dist/viewer/server.js is the entry point the CLI spawns."
  # --- Engine bridge layer (viewer-side) ---
  - path: "apps/viewer/lib/project-root.ts"
    action: create
    description: "Reads PRIMITIV_PROJECT_ROOT env var. Throws a typed error `ProjectRootNotConfiguredError` if missing (the CLI always sets it; only absent during viewer dev)."
  - path: "apps/viewer/lib/engine.ts"
    action: create
    description: "Module-level singleton cache keyed by project root. `getEngine()` lazily calls `PrimitivEngine.load(projectRoot)` and caches the instance. Invalidation is unnecessary because engines always re-read the filesystem on each method call."
  - path: "apps/viewer/lib/load-dashboard.ts"
    action: create
    description: "Returns { specCounts: Record<SpecStatus, number>, specTotal, gates: { company: boolean; security: boolean }, constitutions: { product: boolean; dev: boolean; architecture: boolean }, parseErrors: number }. Uses `engine.listSpecs()` for counts and `engine.getGate()` / `engine.getConstitution()` wrapped in try/catch for presence. — Feature: Dashboard Overview > Scenarios: populated, missing artifacts."
  - path: "apps/viewer/lib/load-specs.ts"
    action: create
    description: "Returns { rows: SpecRow[], errors: ParseError[] } using the new `engine.specs.listWithErrors()`. SpecRow = { id, title, status, branch, updatedAt, hasParseError }. — Feature: Specs List > all scenarios; Feature: Graceful Handling of Malformed Files > Scenario: Malformed file still appears in list views."
  - path: "apps/viewer/lib/load-spec-detail.ts"
    action: create
    description: "Calls `engine.specs.getSpecGraph(id)` (extended). Wraps frontmatter parse in try/catch to emit ParseErrorResult for the malformed-frontmatter case. Returns a discriminated union: { ok: true, graph } | { ok: false, parseError, rawBody }. Discovers available artifact tabs by checking which fields on the graph are non-null and which optional files exist on disk. — Feature: Spec Detail With Artifacts > all scenarios; Feature: Graceful Handling of Malformed Files > Scenario: Malformed frontmatter renders body with a warning banner."
  - path: "apps/viewer/lib/load-gate.ts"
    action: create
    description: "Wraps `engine.getGate(type)` with parse-error handling. Same discriminated return shape as load-spec-detail. — Feature: Gates Viewer > both scenarios."
  - path: "apps/viewer/lib/load-constitution.ts"
    action: create
    description: "Wraps `engine.getConstitution(type)` with parse-error handling. — Feature: Constitutions Viewer > both scenarios."
  - path: "apps/viewer/lib/load-learnings.ts"
    action: create
    description: "Lists `.primitiv/learnings/*.md`. Returns empty array if the directory does not exist (no error). — Feature covered implicitly by learnings route."
  - path: "apps/viewer/lib/markdown.ts"
    action: create
    description: "Exports a configured react-markdown remark/rehype plugin array (remark-gfm, rehype-highlight or rehype-shiki) and a `components` map override for Gherkin-aware rendering: styled cards for Feature/Scenario/Background/Scenario Outline headings and keyword highlighting for Given/When/Then/And/But in paragraph text. — Feature: Spec Detail > Scenario: Gherkin acceptance criteria rendered readably."
  # --- App Router pages ---
  - path: "apps/viewer/app/layout.tsx"
    action: create
    description: "Root Server Component layout. Loads Lato via next/font/google. Applies dark theme class. Mounts <Sidebar /> and <LiveReloadClient /> (thin client island). Renders children in the main content area."
  - path: "apps/viewer/app/globals.css"
    action: create
    description: "Tailwind directives + shadcn CSS variables (light + dark palettes). Primary theme is dark."
  - path: "apps/viewer/app/page.tsx"
    action: create
    description: "Dashboard Server Component. Calls load-dashboard. Renders total spec count, per-status breakdown, gate presence badges, constitution presence badges. — Feature: Dashboard Overview > both scenarios."
  - path: "apps/viewer/app/specs/page.tsx"
    action: create
    description: "Specs list Server Component. Calls load-specs, passes rows into a client-side <SpecsTable /> wrapped around shadcn Table with sortable headers and client-side filter input. Renders a banner listing parse errors at the top if any exist. Empty state when no specs. — Feature: Specs List > all scenarios."
  - path: "apps/viewer/app/specs/[id]/page.tsx"
    action: create
    description: "Spec detail Server Component. Calls load-spec-detail. Renders <FrontmatterPanel />, <WarningBanner /> when parseError, then a <Tabs /> (shadcn) with one tab per non-null artifact. Tab contents use <MarkdownRenderer />. Tab list is built dynamically from the graph. — Feature: Spec Detail With Artifacts > all scenarios; Feature: Graceful Handling of Malformed Files > Scenario: Malformed frontmatter."
  - path: "apps/viewer/app/gates/page.tsx"
    action: create
    description: "Gates index Server Component. Hardcoded list of two gates with presence badges from load-dashboard (or a quick engine.getGate try/catch). — Feature: Gates Viewer > Scenario: Gates index lists both gates."
  - path: "apps/viewer/app/gates/[name]/page.tsx"
    action: create
    description: "Gate detail Server Component. Validates `name` against {'company-principles','security-principles'} via Zod. Calls load-gate. Renders FrontmatterPanel + MarkdownRenderer. — Feature: Gates Viewer > Scenario: Gate detail."
  - path: "apps/viewer/app/constitutions/page.tsx"
    action: create
    description: "Constitutions index Server Component. Three entries: product, development, architecture. — Feature: Constitutions Viewer > Scenario: index lists all three."
  - path: "apps/viewer/app/constitutions/[name]/page.tsx"
    action: create
    description: "Constitution detail Server Component. Zod-validated param. Calls load-constitution. Renders FrontmatterPanel + MarkdownRenderer. — Feature: Constitutions Viewer > Scenario: constitution detail."
  - path: "apps/viewer/app/learnings/page.tsx"
    action: create
    description: "Learnings list Server Component. Calls load-learnings. Friendly empty state if the directory is absent or empty."
  - path: "apps/viewer/app/learnings/[id]/page.tsx"
    action: create
    description: "Learning detail Server Component. Zod-validated param. Renders the single learning with FrontmatterPanel + MarkdownRenderer."
  - path: "apps/viewer/app/error.tsx"
    action: create
    description: "Client error boundary (Next.js App Router requires client). Logs error to console in dev, shows friendly message with a retry button. Aligns with 'No silent failures' dev-constitution rule."
  - path: "apps/viewer/app/not-found.tsx"
    action: create
    description: "Custom 404 page linking back to the dashboard."
  # --- Shared components ---
  - path: "apps/viewer/components/sidebar.tsx"
    action: create
    description: "Server Component. Renders navigation links for Dashboard, Specs, Gates, Constitutions, Learnings. Uses lucide-react icons. Active state via next/navigation usePathname inside a small client child."
  - path: "apps/viewer/components/sidebar-link.tsx"
    action: create
    description: "'use client' — wraps a Link with active state styling via usePathname."
  - path: "apps/viewer/components/status-badge.tsx"
    action: create
    description: "Server Component. Color-coded badge per SpecStatus (mirrors the chalk colors in src/commands/status.ts)."
  - path: "apps/viewer/components/frontmatter-panel.tsx"
    action: create
    description: "Server Component. Renders YAML frontmatter as a structured key/value list. Handles nested objects and arrays with a small recursive component."
  - path: "apps/viewer/components/markdown-renderer.tsx"
    action: create
    description: "Server Component. Wraps react-markdown with the plugin array and component overrides from lib/markdown.ts. Gherkin-aware: custom heading renderer detects 'Feature:', 'Scenario:', 'Background:', 'Scenario Outline:' prefixes and wraps in styled cards; text renderer highlights Given/When/Then/And/But leading keywords. — Feature: Spec Detail > Scenario: Gherkin acceptance criteria rendered readably."
  - path: "apps/viewer/components/warning-banner.tsx"
    action: create
    description: "Server Component. Shows a visible warning with the parse error and file path. Uses shadcn Alert component. — Feature: Graceful Handling of Malformed Files > Scenario: Malformed frontmatter renders body."
  - path: "apps/viewer/components/live-reload-client.tsx"
    action: create
    description: "'use client'. On mount, opens ws://window.location.host. On 'refresh' message, calls router.refresh(). On close/error, retries with exponential backoff (max 10s). Silent failure — never renders UI. — Feature: Live Reload > all scenarios."
  - path: "apps/viewer/components/specs-table.tsx"
    action: create
    description: "'use client'. Receives SpecRow[]. Shadcn Table with sortable ID/status columns and a filter Input. Client-side filter only. — Feature: Specs List > Scenario: Specs list filters by search query."
  - path: "apps/viewer/components/ui/*.tsx"
    action: create
    description: "Shadcn components added via the shadcn CLI during the tasks phase: button, card, table, tabs, badge, alert, input, separator. Committed to the repo per shadcn convention."
  # --- Tests ---
  - path: "apps/viewer/tests/unit/markdown.test.ts"
    action: create
    description: "Vitest. Asserts that MarkdownRenderer wraps Feature/Scenario blocks and highlights Given/When/Then correctly for a fixture markdown string."
  - path: "apps/viewer/tests/unit/load-specs.test.ts"
    action: create
    description: "Vitest. Fixture `.primitiv/` with one valid spec and one spec with broken frontmatter. Asserts load-specs returns both, with the bad one flagged."
  - path: "apps/viewer/tests/e2e/dashboard.spec.ts"
    action: create
    description: "Playwright. Spawns `node dist/viewer/server.js` against a fixture, navigates to /, asserts spec count and gate/constitution badges. — Feature: Dashboard Overview."
  - path: "apps/viewer/tests/e2e/specs.spec.ts"
    action: create
    description: "Playwright. Navigates /specs, filters by 'gherkin', asserts rows, then opens a spec and switches through tabs. — Feature: Specs List + Spec Detail."
  - path: "apps/viewer/tests/e2e/live-reload.spec.ts"
    action: create
    description: "Playwright. Loads /specs/SPEC-001, writes a marker string into the fixture spec.md, waits ≤500ms, asserts the marker appears on the page. — Feature: Live Reload."
  - path: "apps/viewer/tests/fixtures/.primitiv/**"
    action: create
    description: "Minimal fixture tree: state.json, one gate, one constitution, two specs (one with a broken frontmatter)."
  - path: "tests/commands/view.test.ts"
    action: create
    description: "Vitest integration test. Spawns `primitiv view --no-open --port <free>` against a tmp project; asserts VIEWER_READY on stdout; hits GET / and expects 200; sends SIGTERM and expects a clean exit. Also asserts the port-in-use and no-project failure modes. — Feature: CLI Launches The Viewer > all scenarios."
risks:
  - "Next.js 16 handling of imports from `../../src/*`. outputFileTracingRoot + tsconfig paths should cover it, but the engine files use `.js`-suffixed ESM specifiers (TS NodeNext style). Next.js's bundler may need experimental config. Mitigation: add a minimal webpack resolve extension if the build fails, before reaching for transpilePackages."
  - "Custom server + standalone output. Next.js's standalone mode generates its own server.js. Our custom server.ts replaces it. The copy-standalone script must ensure dist/viewer/server.js is ours (with Next.js booted programmatically) and not the generated one. Integration test must exercise the copied bundle, not the dev source."
  - "Published tarball size growth. Standalone bundle + shadcn dependencies likely add tens of MB. Must be measured after the first successful build; if it exceeds a threshold (propose 80MB) the task phase should investigate dependency trimming or a separate @primitiv/viewer package."
  - "Engines must remain RSC-compatible. Any future engine change that introduces Node-only globals (worker_threads, child_process at import time) or relies on cwd-relative paths could break the viewer. Mitigation: add a smoke test that imports every engine class inside a Next.js Server Component during CI."
  - "Chokidar quirks on Windows / WSL / macOS native fs events. Debounce window helps but cross-platform watcher behavior is a known headache. Mitigation: Playwright live-reload test runs on all three CI platforms; fall back to polling mode if native events are unreliable (chokidar supports this via `usePolling: true`)."
  - "Path alias `@cli/*` into src/ couples the viewer build to the CLI source shape. Engine refactors that move files will break the viewer silently until the next viewer build. Mitigation: viewer build runs in CI for every CLI change."
  - "Port-in-use detection is racy (check-then-bind). Mitigation: try to bind first and translate EADDRINUSE into the friendly error rather than pre-checking."
  - "WebSocket broadcast on every `.primitiv/` write, including writes the viewer's own engine triggers. Viewer is read-only so it shouldn't write, but be paranoid — test coverage must confirm no writes happen during a normal page load."
  - "Tarball metadata (`files` array) must include `dist/viewer/**` recursively. Missing a nested directory silently breaks `primitiv view` for published users. Mitigation: smoke-test the published tarball via `npm pack` + extract + `primitiv view --no-open` in CI before release."
dependencies:
  - "ADR-001 through ADR-005 in architecture constitution v2 (already landed on this branch) sanction the viewer's stack, loopback bind, and standalone packaging. Plan assumes these are authoritative."
  - "Development constitution's TDD mandate, 'no silent failures' rule, strict TypeScript, and shadcn/ui stack choice apply unchanged."
  - "New runtime deps reviewed for security/maintenance: react-markdown, remark-gfm, rehype-highlight, chokidar, ws, open. All are widely-used, actively maintained packages."
  - "SPEC-012 internal state names (`gate-1-passed`, `gate-2-passed`) are stable and the viewer relies on them for status coloring."
  - "No blocking specs — SPEC-013 is self-contained once the architecture constitution amendment is in place."
codebaseAnalysis:
  existingCode:
    - "src/engine/PrimitivEngine.ts — facade exposing gates, constitutions, specs, learnings, compiler. `PrimitivEngine.load(projectRoot)` asserts git + initialization. This is the viewer's single entry point into the CLI's domain logic."
    - "src/engine/SpecManager.ts — `list({ status })`, `get(specId)`, `getSpecGraph(specId)` returning { spec, plan, tasks, testResults, clarifications }. `list()` silently skips malformed specs via try/catch (line 76-78) — viewer needs a non-silent variant."
    - "src/engine/GateManager.ts — `getGate(type)` returns parsed gate frontmatter."
    - "src/engine/ConstitutionManager.ts — `get(type)` returns parsed constitution frontmatter."
    - "src/engine/LearningManager.ts — loads .primitiv/learnings/*.md (directory is optional in this repo)."
    - "src/utils/frontmatter.ts — `parseDocument(raw, schema)` is the canonical parser used by every engine. Viewer fallback loader for malformed files should reuse gray-matter directly and re-raise the schema error."
    - "src/schemas/common.ts — SPEC_STATUSES + SpecStatus type. Exported and reused by src/commands/status.ts for coloring. Viewer StatusBadge mirrors this."
    - "src/commands/status.ts — existing pattern for command handlers (runX(targetDir, options)); also the reference for status color mapping (chalk colors in lines 94-106 map directly to Tailwind classes)."
    - "src/cli.ts — Commander registration pattern. `primitiv view` follows the same shape as `primitiv status`."
    - "src/utils/fileSystem.ts — `isPrimitivInitialized(targetDir)` for the 'not a Primitiv project' guard."
    - "src/utils/errors.ts — NotInitializedError / SpecNotFoundError base classes to reuse for friendly viewer errors."
    - "esbuild.config.js — existing publish pipeline; new `build:viewer` step slots in before the final bundle."
  reusableModules:
    - "PrimitivEngine (single import point — the viewer should not reach past this facade)"
    - "SpecManager.getSpecGraph() — nearly matches the viewer tab requirements; needs one extension for research/clarifications-as-markdown"
    - "GateManager.getGate() + ConstitutionManager.get()"
    - "parseDocument() + SpecFrontmatterSchema / PlanFrontmatterSchema / TasksFrontmatterSchema — for any viewer-side raw parsing"
    - "SPEC_STATUSES list + SpecStatus type from src/schemas/common.ts"
    - "isPrimitivInitialized() / NotInitializedError from utils"
    - "chalk-color mapping in src/commands/status.ts as the source of truth for status color semantics (translated to Tailwind in StatusBadge)"
  patternsToFollow:
    - "Command handlers are thin: `runX(targetDir, options)` — parse options, call engine, format output. src/commands/view.ts follows this exactly."
    - "Engine methods throw typed errors; command handlers catch and set process.exitCode = 1 with a friendly message (see src/commands/status.ts filter validation)."
    - "Zod schemas are the single source of truth — viewer route params validated with Zod, not hand-written guards."
    - "All file I/O lives behind engine classes — viewer code MUST NOT read `.primitiv/` directly except for the new listWithErrors() branch that reports parse errors."
    - "No mocking of filesystem in tests — CLI tests use memfs, viewer tests use real temp dirs (Next.js requires real fs)."
    - "Named exports only (no default exports except Next.js page/layout conventions which require default exports)."
updatedAt: "2026-04-11T13:00:00Z"
---

# Implementation Plan — SPEC-013 Web Spec Viewer

## Approach

Add a Next.js 16 app at `apps/viewer/` that reuses the existing `PrimitivEngine` via a tsconfig path alias into `../../src/*`. The viewer ships as a prebuilt standalone Node server under `dist/viewer/` inside the published `primitiv` npm tarball. A new `primitiv view` CLI command spawns the prebuilt server with `PRIMITIV_PROJECT_ROOT` set to the user's working directory, waits for a `VIEWER_READY` sentinel on stdout, and opens the default browser.

Live reload runs inside the same Node process: a `chokidar` watcher over `.primitiv/**` broadcasts `refresh` events over a WebSocket server attached to the same HTTP listener; a thin client component calls `router.refresh()` on receipt.

Markdown is rendered in Server Components via `react-markdown` + `remark-gfm`, with custom component overrides that style Gherkin `Feature:` / `Scenario:` / `Background:` headings as cards and highlight `Given` / `When` / `Then` / `And` / `But` leading keywords.

The engine layer is the single reuse seam (ADR-003). The viewer does not re-implement any parsing, validation, or state logic — it imports `PrimitivEngine.load(projectRoot)` and calls methods on it from inside Server Components.

## Why This Shape

Four forces shape the architecture:

1. **Reuse over re-implementation.** Every parsing and validation rule already exists in `src/engine/`. Importing from there via a tsconfig alias gives us zero duplication and a guaranteed single source of truth. The alternative (extracting `packages/core`) is a cleaner boundary but a much bigger refactor — ADR-003 explicitly scopes it out for now.

2. **Offline, zero-build distribution.** End users install `primitiv` with `npm i -g primitiv` and expect `primitiv view` to just work. Building Next.js on their machine would require `next` as a runtime dep and a network-reachable npm registry on first launch — neither is acceptable. A prebuilt standalone bundle (ADR-004) resolves this.

3. **Loopback safety by default.** The viewer can read arbitrary project files. Binding to `127.0.0.1` with no authentication (ADR-005) is the only configuration that is safe without adding auth machinery. The CLI command enforces this; integration tests verify it.

4. **Live reload without polling.** The user asked for real-time updates. `chokidar` + WebSocket + `router.refresh()` keeps everything server-rendered, uses one client island, and avoids busy-polling an API.

## File Changes Summary

See the `fileChanges` frontmatter section above for the authoritative list. Totals:

- **Modify:** 4 files (package.json, esbuild.config.js, .gitignore, src/cli.ts, src/engine/SpecManager.ts)
- **Create (CLI side):** 2 files (src/commands/view.ts, tests/commands/view.test.ts)
- **Create (viewer scaffold):** ~45 files including App Router pages, components, lib helpers, tests, fixtures, and config

Every file change maps to specific Gherkin scenarios from the spec's acceptance criteria — references are embedded in the `description` field of each `fileChanges` entry.

## Architecture Integration

The viewer slots into the boundaries defined in `architecture.md` v2:

- **CLI Entry + Command Layer** gain one new command (`primitiv view` in `src/commands/view.ts`), registered in `src/cli.ts`. The handler is thin — it validates, spawns, and opens a browser. All domain logic stays in engines.
- **Engine Layer** gains one new method (`SpecManager.listWithErrors()`) and an extended `getSpecGraph()` return type. Both are backward-compatible additions.
- **Web Viewer boundary** (newly introduced in architecture constitution v2) is fully populated by `apps/viewer/`.
- **Governance Store** is unchanged — the viewer is strictly read-only.
- **Build pipeline** gains a `build:viewer` step in `esbuild.config.js` and a post-build copy into `dist/viewer/`.

No other boundaries are touched.

## Risks

See the `risks` frontmatter section. The top three to watch during implementation:

1. **Next.js 16 + out-of-tree TS imports.** The `@cli/*` alias into `../../src/*` with `.js`-suffixed ESM specifiers may need experimental config. Mitigation: accept a webpack resolve extension if needed; fail loudly if the build can't handle it and reconsider extracting `packages/core` before shipping.

2. **Custom server.ts + standalone output.** Next.js's standalone mode generates its own `server.js`; our custom one must replace it correctly inside `dist/viewer/`. The CLI integration test exercises the copied bundle, not the dev source, so this is caught before release.

3. **Published tarball size.** Standalone bundles are not tiny. If the viewer pushes the tarball past a reasonable threshold (~80MB), reconsider a separate `@primitiv/viewer` package (option 4 from the packaging clarification, previously rejected). This should be measured after the first green build.

## Dependencies

See the `dependencies` frontmatter section. No blocking external dependencies — the only prerequisite was the architecture constitution amendment, which has already landed on this branch.

## Out of Scope Reminders

From the spec's Out of Scope section, keep these explicitly deferred:

- Write operations of any kind
- Authentication, multi-tenancy, hosted deployment
- Diff/git-history views
- Slash-command execution from the UI
- Monorepo refactor to `packages/core`
- `--dev` flag on `primitiv view`
