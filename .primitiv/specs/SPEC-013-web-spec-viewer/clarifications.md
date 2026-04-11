# Clarifications — SPEC-013 Web Spec Viewer

## Q: The viewer omits Prisma/Postgres, Temporal, and better-auth — all mandated by the architecture constitution. How should this deviation be handled?
**A:** Amend the architecture constitution
**Reason:** The framing of the question was wrong. This repo is the **CLI** of Primitiv, not the Primitiv Platform. The current `.primitiv/constitutions/architecture.md` describes the Platform's stack (Next.js 16, Postgres, Prisma, Temporal, better-auth, shadcn) — but this repo's actual runtime is Node + TypeScript + Commander + Zod + gray-matter + @clack/prompts. The constitution is targeting the wrong artifact, so there is no deviation to ratify — the constitution itself needs to be rewritten to describe the CLI's architecture.
**Impact:**
- Before `/primitiv.plan` runs, the architecture constitution must be amended via `/primitiv.constitution architecture amend` to describe the CLI (its stack, boundaries, module layout) and to position the SPEC-013 viewer as a new optional Next.js surface on top of the CLI.
- SPEC-013's own Constraints section no longer needs to flag "deliberate deviation" language for Prisma/Temporal/better-auth. Those technologies simply aren't part of the CLI's architecture.
- The viewer's stack (Next.js 16 App Router + shadcn/ui + Tailwind + TypeScript strict + Zod, no DB / no auth / no workflow) becomes the sanctioned stack for this feature, documented in the amended constitution.

## Q: Where should the Next.js viewer app live in the repo?
**A:** `apps/viewer/`
**Impact:** The repo gains a top-level `apps/` directory. The CLI stays in `src/` for now; a future move to `apps/cli/` is not part of this spec. The viewer has its own `package.json`, `tsconfig.json`, and Next.js config inside `apps/viewer/` — isolated from the CLI's tsconfig so Next.js build concerns don't leak into CLI compilation.

## Q: How should the Next.js app be packaged inside the published npm package?
**A:** Prebuilt standalone server
**Impact:** `apps/viewer/next.config.ts` sets `output: 'standalone'`. The publish pipeline (`prepublishOnly` or a dedicated `build:viewer` script) runs `next build` against `apps/viewer/`, then copies `apps/viewer/.next/standalone/` + `apps/viewer/.next/static/` + `apps/viewer/public/` into the tarball under a known path (e.g. `dist/viewer/`). The `files` array in the root `package.json` must include `dist/viewer/`. `primitiv view` spawns `node dist/viewer/server.js`. No build step runs on the user's machine; the viewer works fully offline and Server Components can read `.primitiv/` directly via the filesystem. Published tarball size grows by the standalone bundle (estimate: low tens of MB) — this must be measured during the plan phase.

## Q: What launch mode should `primitiv view` use?
**A:** Prod server only
**Impact:** `primitiv view` always runs the prebuilt production server. No `--dev` flag is exposed. Contributors working on the viewer itself run `npm run dev` inside `apps/viewer/` directly — not through the CLI command. `next` and `react` stay in `apps/viewer/package.json` devDependencies; they are not dependencies of the root `primitiv` package at runtime (the standalone bundle inlines what it needs).

## Q: Should the CLI command be named `primitiv view`, or something else?
**A:** `primitiv view`
**Impact:** Confirmed. The new command file is `src/commands/view.ts`, registered in `src/cli.ts` alongside the existing commands. Help text: "View the current Primitiv project in a web browser (read-only)."

## Q: How should engine code (`SpecManager`, `GateManager`, `ConstitutionManager`, `LearningManager`) be shared between the CLI and the viewer?
**A:** Direct import from `src/engine/`
**Impact:** `apps/viewer/tsconfig.json` declares a path alias (e.g. `@cli/*` → `../../src/*`) so viewer Server Components import engine classes directly from the CLI source tree. Zero duplication, single source of truth, no workspace-package refactor required. The Next.js build must be configured to transpile those imported files (`transpilePackages` or equivalent) since they live outside `apps/viewer/`. If the repo later moves to a real monorepo with `packages/core`, the alias becomes the migration seam.

## Q: Which markdown rendering library should the viewer use?
**A:** `react-markdown` + `remark-gfm`
**Impact:** Added to `apps/viewer/package.json` dependencies. Custom component overrides for Gherkin styling: headings matching `Feature:` / `Scenario:` / `Background:` / `Scenario Outline:` render as styled cards, and a custom text renderer highlights `Given` / `When` / `Then` / `And` / `But` as leading keywords. Code blocks get syntax highlighting via `rehype-highlight` or `rehype-shiki` (exact choice deferred to plan phase — no impact on acceptance criteria). Works in Server Components, no client-side hydration of content needed.

## Q: Should `primitiv view` auto-open the user's browser on launch?
**A:** Yes, with `--no-open` flag
**Impact:** Default behavior opens the default browser to `http://localhost:<port>/`. `primitiv view --no-open` suppresses the open for headless / SSH / CI contexts. Implementation uses `open` (npm package) or equivalent. If browser-open fails (e.g. on a server with no display), the command logs a warning and continues — the server stays up regardless. Print the URL to stdout in all cases.

## Q: How should the viewer handle `.primitiv/` files with malformed YAML frontmatter or invalid content?
**A:** Render body, warn in metadata panel
**Impact:** The loader wraps `gray-matter` in a try/catch. On failure, it returns `{ frontmatter: null, body: rawFileContents, parseError: <error message> }`. The page renders the body as-is and shows a prominent warning banner at the top of the metadata panel listing the parse error and the file path. The file still appears in list views (so the user can find and fix it). This aligns with the "No silent failures" development-constitution principle — the error is surfaced, never swallowed, and the content remains accessible.

## Q: The spec proposes port 3141 as the default. Keep it?
**A:** 3141
**Impact:** Confirmed. `src/commands/view.ts` defaults `--port` to 3141. If the port is already in use, the command fails with a clear error message suggesting `--port <n>`. No automatic fallback — explicit failure is easier to reason about.

## Q: Should the viewer live-reload when `.primitiv/` files change on disk?
**A:** Yes, watch + WebSocket
**Impact:** **Scope addition** — live reload moves from "Out of Scope" into MVP.
- The viewer adds a filesystem watcher (`chokidar`) running in the Node server process, scoped to `.primitiv/**`.
- A WebSocket server runs alongside the Next.js standalone server. On any debounced change event, it broadcasts a `refresh` message.
- A thin client component mounted in the root layout opens the WebSocket on load and refreshes the current route (`router.refresh()`) when it receives `refresh`. This keeps everything server-rendered — only the WebSocket client is a `"use client"` island.
- Debounce window: 200ms to collapse burst writes (e.g. when the user runs `/primitiv.specify` which writes multiple files at once).
- Handle reconnection if the server restarts; silent drop on close.
- New acceptance scenario added to the "CLI Launches The Viewer" feature covering live reload.
- Runtime dependencies grow by chokidar + ws (or equivalent). Must not bloat the standalone bundle excessively.

## Q: Should the learnings page ship in the MVP?
**A:** Yes, include in MVP
**Impact:** `/learnings` and `/learnings/[id]` routes ship with the first release. If `.primitiv/learnings/` does not exist, the page shows a friendly empty state ("No learnings recorded yet — run /primitiv.learn to add one") but the sidebar entry remains visible. This is simpler than conditionally hiding navigation and nudges users toward the learning loop.
