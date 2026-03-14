# Primitiv Spec Engine

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
  │     ├─ /primitiv.clarify  → Interactive Q&A
  │     ├─ /primitiv.plan     → Technical plan (searches codebase via GitNexus)
  │     ├─ /primitiv.tasks    → Task breakdown
  │     └─ /primitiv.implement → Execute tasks
  │
  └─ Done (merge branch)
```

## Quick Start

```bash
# Install
npm install primitiv-spec-engine

# Initialize in a git repo
primitiv init .                    # brownfield (default, analyzes existing code)
primitiv init . --greenfield       # greenfield (empty templates)
```

This creates `.primitiv/` (gates, constitutions, specs) and installs 8 slash commands into `.claude/commands/`.

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
| `/primitiv.implement` | Execute tasks |

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
```

## SDK

```typescript
import { PrimitivEngine } from "primitiv-spec-engine";

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
draft → gate-1-passed → gate-2-passed → gate-3-passed → clarified → planned → tasked → in-progress → completed
```

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
│       └── tasks.md
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
