# Primitiv

Spec Driven Development (SDD) engine for AI-assisted software development. A gated validation pipeline that ensures every feature goes through company principles, security review, and constitutional alignment before implementation.

## How It Works

```
primitiv init .
  │
  ├─ /primitiv.gate-1  → Company Principles
  ├─ /primitiv.gate-2  → Security Principles
  │
  ├─ /primitiv.constitution product  → Product Constitution
  ├─ /primitiv.constitution dev      → Development Constitution
  ├─ /primitiv.constitution arch     → Architecture Constitution
  │
  ├─ /primitiv.specify <description> → Create spec (creates git branch)
  │     ├─ Gate 1, 2, 3 checks
  │     ├─ /primitiv.clarify       → Interactive Q&A
  │     ├─ /primitiv.plan          → Technical plan (searches codebase via GitNexus)
  │     ├─ /primitiv.tasks         → Task breakdown
  │     ├─ /primitiv.implement     → Execute tasks
  │     ├─ /primitiv.test-feature  → Generate & run tests
  │     └─ /primitiv.compushpr     → Commit, push, PR, squash merge
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

This creates `.primitiv/` (gates, constitutions, specs) and installs 12 slash commands into `.claude/commands/`.

## Slash Commands

Use these in Claude Code (or any compatible agent):

| Command | Purpose |
|---------|---------|
| `/primitiv.gate-1 generate <description>` | Generate company principles |
| `/primitiv.gate-2 generate <description>` | Generate security principles |
| `/primitiv.constitution <type> generate <description>` | Generate constitution (product/dev/arch) |
| `/primitiv.specify <feature description>` | Create a spec + git branch + run gate checks |
| `/primitiv.clarify` | Interactive Q&A to resolve assumptions |
| `/primitiv.plan` | Technical plan with codebase analysis |
| `/primitiv.tasks` | Break plan into actionable tasks |
| `/primitiv.implement` | Execute tasks (parallel when possible via git worktrees) |
| `/primitiv.test-feature` | Generate & run tests from acceptance criteria |
| `/primitiv.compushpr` | Commit, push, create PR, squash merge |

All commands also support `amend` to modify existing documents:
```
/primitiv.gate-1 amend add DORA compliance requirement
/primitiv.constitution dev amend switch from Jest to Vitest
```

## CLI

```bash
primitiv status                      # Show all specs and pipeline state
primitiv status SPEC-001             # Show specific spec details
primitiv validate SPEC-001           # Validate against all gates
primitiv validate SPEC-001 --gate 1  # Validate against specific gate
primitiv update .                    # Update slash commands (preserves data)
```

## SDK

```typescript
import { PrimitivEngine } from "primitiv";

const engine = PrimitivEngine.load(".");

// Gates & Constitutions
engine.getGate("company");
engine.validateGate("security");
engine.getConstitution("product");

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

## GitNexus Integration

`primitiv init` configures [GitNexus](https://www.npmjs.com/package/gitnexus) as an MCP server. The `/primitiv.plan` command uses GitNexus to search the existing codebase before planning — finding reusable code, understanding architecture, and avoiding rebuilding what exists.

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
