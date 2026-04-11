# Primitiv

[![npm version](https://img.shields.io/npm/v/primitiv)](https://www.npmjs.com/package/primitiv)
[![CI](https://img.shields.io/github/actions/workflow/status/primitiv-ai/primitiv/ci.yml?branch=main&label=CI)](https://github.com/primitiv-ai/primitiv/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/node/v/primitiv)](https://nodejs.org)

Spec Driven Development (SDD) engine for AI-assisted software development. A gated validation pipeline that ensures every feature goes through company principles, security review, and constitutional alignment before implementation.

## How It Works

```
primitiv init .
  │
  ├─ /primitiv.company-principles   → Company Principles
  ├─ /primitiv.security-principles  → Security Principles
  │
  ├─ /primitiv.constitution product  → Product Constitution
  ├─ /primitiv.constitution dev      → Development Constitution
  ├─ /primitiv.constitution arch     → Architecture Constitution
  │
  ├─ /primitiv.compile              → Compile governance context
  │
  ├─ /primitiv.specify <description> → Create spec (creates git branch)
  │     ├─ Gate checks (with Gherkin BDD scenarios)
  │     ├─ /primitiv.clarify       → Interactive Q&A
  │     ├─ /primitiv.plan          → Technical plan (searches codebase via GitNexus)
  │     ├─ /primitiv.tasks         → Task breakdown
  │     ├─ /primitiv.implement     → Execute tasks
  │     ├─ /primitiv.test-feature  → Generate & run tests
  │     └─ /primitiv.compushpr     → Commit, push, PR, squash merge
  │
  ├─ primitiv learn                 → Self-learning loop (captures lessons)
  │
  ├─ primitiv view                  → Browse specs, gates, constitutions in a local web UI
  │
  └─ Done
```

## Quick Start

```bash
# Install globally + set up your project (interactive wizard)
npx primitiv install

# Or if already installed globally:
primitiv init                      # interactive wizard
primitiv init --brownfield         # skip menu, analyze existing code
primitiv init --greenfield         # skip menu, empty templates
```

This creates `.primitiv/` (gates, constitutions, specs) and installs slash commands into `.claude/commands/`.

## Slash Commands

Use these in Claude Code (or any compatible agent):

| Command | Purpose |
|---------|---------|
| `/primitiv.company-principles generate <description>` | Generate company principles |
| `/primitiv.security-principles generate <description>` | Generate security principles |
| `/primitiv.constitution <type> generate <description>` | Generate constitution (product/dev/arch) |
| `/primitiv.compile` | Compile governance into a structured context |
| `/primitiv.specify <feature description>` | Create a spec + git branch + run gate checks |
| `/primitiv.clarify` | Interactive Q&A to resolve assumptions |
| `/primitiv.plan` | Technical plan with codebase analysis |
| `/primitiv.tasks` | Break plan into actionable tasks |
| `/primitiv.implement` | Execute tasks (parallel when possible via git worktrees) |
| `/primitiv.test-feature` | Generate & run tests from acceptance criteria |
| `/primitiv.compushpr` | Commit, push, create PR, squash merge |
| `/primitiv.migrate` | Migrate from SpecKit to Primitiv |

All commands also support `amend` to modify existing documents:
```
/primitiv.company-principles amend add DORA compliance requirement
/primitiv.constitution dev amend switch from Jest to Vitest
```

## CLI

```bash
primitiv status                           # Show all specs and pipeline state
primitiv status SPEC-001                  # Show specific spec details
primitiv status --filter in-progress      # Filter specs by status
primitiv status --output report.md        # Export status report to file
primitiv validate SPEC-001                # Validate against all gates
primitiv validate SPEC-001 --gate 1       # Validate against specific gate
primitiv upgrade                          # Upgrade project (sync dirs, commands, config)
primitiv compile                          # Compile governance into structured context
primitiv migrate speckit                  # Migrate from SpecKit to Primitiv

# Web Viewer
primitiv view                             # Launch the read-only web viewer in your browser
primitiv view --port 4200                 # Override the default port (3141)
primitiv view --no-open                   # Start the server without opening a browser

# Self-Learning Loop
primitiv learn add --type best-practice --title "Use batch inserts" --tags "db,perf"
primitiv learn list --type convention
primitiv learn search "database"
primitiv learn remove LEARN-001
```

### Web Viewer

`primitiv view` launches a read-only Next.js 16 web interface that renders the current project's `.primitiv/` directory: dashboard, specs list, per-spec detail with tabs for every artifact (spec, clarifications, plan, tasks, test results, research), gates, constitutions, and learnings. The Tasks tab offers both a 4-column Kanban board and an interactive dependency graph (pan/zoom, click a node to open the task in a full detail modal). Gates and constitutions render with collapsible metadata panels and Gherkin-aware markdown highlighting for `Feature:` / `Scenario:` / `Given` / `When` / `Then` blocks.

The viewer is **local-only** — it binds to `127.0.0.1` and has no authentication. The bundle ships prebuilt inside the `primitiv` npm package (no `next build` on your machine), so `primitiv view` launches instantly. All routes re-read the filesystem on every request, so `Cmd/Ctrl+R` picks up any changes you make via the slash commands.

## SDK

```typescript
import { PrimitivEngine } from "primitiv";

const engine = PrimitivEngine.load(".");

// Gates & Constitutions
engine.getGate("company");
engine.validateGate("security");
engine.getConstitution("product");

// Governance compilation
engine.compile(); // → GovernanceContext (structured, machine-readable)

// Specs
engine.createSpec({ title: "User Auth", description: "OAuth2 + MFA" });
engine.getSpec("SPEC-001");
engine.listSpecs({ status: "draft" });
engine.validateSpecGates("SPEC-001");
engine.getSpecGraph("SPEC-001");

// Full context (for agents)
engine.getProjectContext();
```

## Spec Lifecycle

```
draft → gate-1-passed → gate-2-passed → gate-3-passed → clarified → planned → tasked → in-progress → tested → completed
```

## Parallel Implementation

`/primitiv.implement` automatically parallelizes independent tasks using git worktrees:

1. **Dependency graph** — Tasks declare `dependsOn` relationships (set by `/primitiv.tasks`)
2. **Wave computation** — Tasks are grouped into waves via topological sort. Tasks in the same wave have no mutual dependencies and run concurrently.
3. **Isolated execution** — Each parallel task runs in its own git worktree via a Claude Code subagent
4. **Merge-back** — Worktree branches are merged back after each wave completes, with automatic conflict resolution

Single-task waves and single-task specs skip the worktree overhead and execute directly.

## Governance Compilation

`/primitiv.compile` (or `primitiv compile`) merges all gates and constitutions into a single `GovernanceContext` — a structured, machine-readable JSON that downstream pipeline stages (specify, plan, implement) consume automatically. This ensures every spec is checked against the full governance surface without manually loading individual files.

## Self-Learning Loop

Primitiv captures lessons learned during development — best practices, error resolutions, and conventions — so they inform future specs:

```bash
primitiv learn add --type best-practice --title "Use batch inserts for bulk data"
primitiv learn list
primitiv learn search "database"
primitiv learn remove LEARN-001
```

Learnings are stored in `.primitiv/learnings.json` and automatically surfaced during the specify and plan phases.

## Gherkin BDD

The `/primitiv.specify` command generates Gherkin `Given/When/Then` scenarios as part of the spec's acceptance criteria. These scenarios are used by `/primitiv.test-feature` to generate executable tests, closing the loop between specification and verification.

## GitNexus Integration

`primitiv init` configures [GitNexus](https://www.npmjs.com/package/gitnexus) as an MCP server. The `/primitiv.plan` command uses GitNexus to search the existing codebase before planning — finding reusable code, understanding architecture, and avoiding rebuilding what exists.

## Migration from SpecKit

If you have an existing SpecKit project, migrate it to Primitiv:

```bash
primitiv migrate speckit
```

Or use the slash command: `/primitiv.migrate`

This detects your SpecKit structure, maps specs to Primitiv format, and preserves your existing work.

## Project Structure

```
.primitiv/
├── gates/
│   ├── company-principles.md      # Gate 1
│   └── security-principles.md     # Gate 2
├── constitutions/
│   ├── product.md                 # Gate 3
│   ├── development.md             # Gate 3
│   └── architecture.md            # Gate 3
├── specs/
│   └── SPEC-001-feature-name/
│       ├── spec.md
│       ├── clarifications.md
│       ├── plan.md
│       ├── tasks.md
│       └── test-results.md
├── learnings.json                 # Self-learning loop
├── governance-context.json        # Compiled governance
└── .state.json
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
