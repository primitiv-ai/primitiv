---
type: spec
id: SPEC-003
title: "SpecKit-to-Primitiv Migration for Brownfield Projects"
status: completed
version: 10
branch: "spec/SPEC-003-speckit-to-primitiv-migration"
author: "Dieu"
createdAt: "2026-03-16T08:30:00Z"
updatedAt: "2026-03-16T11:16:00Z"
---

# SPEC-003: SpecKit-to-Primitiv Migration for Brownfield Projects

## Description

When adopting Primitiv on an existing codebase (brownfield project) that already uses GitHub's Spec Kit for spec-driven development, there is no migration path. Teams must manually recreate their specs, plans, tasks, and constitutions — losing history, traceability, and momentum.

This spec adds a **migration command** (`/primitiv.migrate` or CLI equivalent) that converts a SpecKit project structure into the Primitiv format, preserving existing artifacts, spec history, and governance documents.

### Problem

GitHub SpecKit and Primitiv share the same philosophical foundation (spec-driven development) but use different:

- **Directory structures**:
  - SpecKit: `.specify/` (with `memory/` subdirectory) + `specs/` at the repo root
  - Primitiv: `.primitiv/` with `specs/`, `gates/`, `constitutions/` subdirectories
- **File formats**: Both use markdown with YAML frontmatter, but with different schemas and field names
- **Artifact naming**:
  - SpecKit: `specs/<NNN>-<slug>/` with files: `spec.md`, `research.md`, `plan.md`, `data-model.md`, `quickstart.md`, `tasks.md`, and a `contracts/` subfolder with additional `.md` files
  - Primitiv: `.primitiv/specs/SPEC-XXX-<slug>/` with files: `spec.md`, `plan.md`, `tasks.md`, `clarifications.md`, `test-results.md`
- **Governance model**: SpecKit stores governance in two places: `.specify/memory/constitution.md` (a single file containing **both** Product Principles and Development Principles sections, plus governance metadata like Principle Interlock, Unacceptable Risks, and Amendment Procedure) and `CLAUDE.md` at the repo root (architecture context — per-spec tech stack entries, patterns, directory conventions). Primitiv separates governance into three constitutions (product, dev, architecture) plus two gates (company principles, security principles)
- **Workflow stages**: SpecKit has `specify → plan → tasks → implement` with optional `clarify/analyze/checklist`; Primitiv has `specify → clarify → plan → tasks → implement → test → compushpr` with gate checks

### Actual SpecKit Directory Layout

```
repo-root/
├── CLAUDE.md                          # Architecture context (stack, patterns, conventions)
├── .specify/
│   └── memory/
│       └── constitution.md            # Product-focused constitution
└── specs/
    └── <NNN>-<slug>/
        ├── spec.md                    # Specification document
        ├── research.md                # Research notes
        ├── plan.md                    # Technical plan
        ├── data-model.md              # Data model definitions
        ├── quickstart.md              # Quickstart guide
        ├── tasks.md                   # Task breakdown
        ├── checklists/
        │   └── requirements.md        # Requirements checklist
        └── contracts/
            └── *.md                   # Contract/interface documents (e.g., api-contracts.md)
```

### Primitiv Directory Layout (Target)

```
repo-root/
└── .primitiv/
    ├── .state.json
    ├── gates/
    │   ├── company-principles.md
    │   └── security-principles.md
    ├── constitutions/
    │   ├── product.md
    │   ├── development.md
    │   └── architecture.md
    └── specs/
        └── SPEC-XXX-<slug>/
            ├── spec.md
            ├── plan.md
            ├── tasks.md
            ├── clarifications.md
            ├── research.md
            ├── data-model/
            │   └── data-model.md
            ├── contracts/
            │   └── *.md
            └── test-results.md
```

A brownfield project switching from SpecKit to Primitiv should not lose its existing specification artifacts.

### Target State

A single command (`/primitiv.migrate speckit`) that:

1. **Detects** the SpecKit project structure (`.specify/` directory, `specs/` folder)
2. **Maps** SpecKit artifacts to Primitiv equivalents:
   - `.specify/memory/constitution.md` → Split into Primitiv `constitutions/product.md` (Product Principles sections) + `constitutions/development.md` (Development Principles sections). Shared governance sections (Principle Interlock, Unacceptable Risks, Governance) are appended to both or to product.md.
   - `CLAUDE.md` (repo root) → Primitiv `constitutions/architecture.md` (copy per-spec tech stack entries, re-reference with Primitiv spec IDs, wrap in Primitiv frontmatter)
   - `specs/<NNN>-<slug>/spec.md` → `.primitiv/specs/SPEC-XXX-<slug>/spec.md`
   - `specs/<NNN>-<slug>/plan.md` → `.primitiv/specs/SPEC-XXX-<slug>/plan.md`
   - `specs/<NNN>-<slug>/tasks.md` → `.primitiv/specs/SPEC-XXX-<slug>/tasks.md`
   - `specs/<NNN>-<slug>/research.md` → `.primitiv/specs/SPEC-XXX-<slug>/research.md`
   - `specs/<NNN>-<slug>/data-model.md` → `.primitiv/specs/SPEC-XXX-<slug>/data-model/data-model.md`
   - `specs/<NNN>-<slug>/quickstart.md` → `.primitiv/specs/SPEC-XXX-<slug>/quickstart.md`
   - `specs/<NNN>-<slug>/checklists/*.md` → `.primitiv/specs/SPEC-XXX-<slug>/checklists/*.md`
   - `specs/<NNN>-<slug>/contracts/*.md` → `.primitiv/specs/SPEC-XXX-<slug>/contracts/*.md`
3. **Initializes** the Primitiv state (`.primitiv/.state.json`) with `nextSpecId` reflecting the migrated count
4. **Preserves** original content while adapting frontmatter to Primitiv's schema
5. **Reports** what was migrated, what was skipped, and what needs manual attention (e.g., gates that don't exist in SpecKit)

### What Gets Migrated

| SpecKit Source | Primitiv Target | Notes |
|---|---|---|
| `.specify/` | `.primitiv/.state.json` | Initialize state with `mode: "brownfield"` and spec count |
| `.specify/memory/constitution.md` | `constitutions/product.md` + `constitutions/development.md` | Multi-strategy section detection: (1) H2 header match (`## Product Principles`, `## Development Principles`), (2) keyword fuzzy match at any heading level, (3) fallback: entire file → product.md with warning. Shared sections (Principle Interlock, Unacceptable Risks, Governance, Explicit Exclusions) go to product.md. Both get Primitiv frontmatter. Skip if target file already exists (merge strategy). |
| `CLAUDE.md` (repo root) | `constitutions/architecture.md` | Full copy of CLAUDE.md content wrapped in Primitiv frontmatter. Per-spec tech stack entries (pattern: `- <entry> (<slug>)`) are identified and re-referenced with Primitiv spec IDs using the mapping table. Non-tech-stack content preserved as-is. |
| `specs/<NNN>-<slug>/spec.md` | `.primitiv/specs/SPEC-XXX-<slug>/spec.md` | Specs sorted by `<NNN>`, re-numbered sequentially as SPEC-001, SPEC-002, etc. Mapping table included in migration report. All migrated specs get `status: completed`. Frontmatter adapted to Primitiv schema. |
| `specs/<NNN>-<slug>/plan.md` | `.primitiv/specs/SPEC-XXX-<slug>/plan.md` | Preserve content, adapt frontmatter |
| `specs/<NNN>-<slug>/tasks.md` | `.primitiv/specs/SPEC-XXX-<slug>/tasks.md` | Map task format, adapt status fields |
| `specs/<NNN>-<slug>/research.md` | `.primitiv/specs/SPEC-XXX-<slug>/research.md` | Direct content transfer |
| `specs/<NNN>-<slug>/data-model.md` | `.primitiv/specs/SPEC-XXX-<slug>/data-model/data-model.md` | Move into `data-model/` subdirectory per Primitiv convention |
| `specs/<NNN>-<slug>/quickstart.md` | `.primitiv/specs/SPEC-XXX-<slug>/quickstart.md` | Direct content transfer (supplementary artifact) |
| `specs/<NNN>-<slug>/checklists/*.md` | `.primitiv/specs/SPEC-XXX-<slug>/checklists/*.md` | Copy checklists directory preserving structure |
| `specs/<NNN>-<slug>/contracts/*.md` | `.primitiv/specs/SPEC-XXX-<slug>/contracts/*.md` | Copy contracts directory preserving structure |

### Architecture Constitution: Per-Spec Append Pattern

The architecture constitution follows the same pattern as SpecKit's `CLAUDE.md` — a **running log of tech stack decisions per spec**, not a deduplicated summary. Each spec implementation appends a line describing what was used/changed from a tech stack and database perspective. Example from a SpecKit project:

```
- N/A (no database changes — UI state fix only) (133-fix-package-upload-state)
- TypeScript 5.7+ (Node.js 20 LTS) + Next.js 15 (App Router), React 19, Radix UI (shadcn/ui), Tailwind CSS, lucide-react (135-operational-dashboard)
- N/A (no database changes — frontend-only redesign) (135-operational-dashboard)
- PostgreSQL via Prisma ORM (new CertificationRequest model, extend AuditAction + NotificationType enums) (139-certification-request-workflow)
- TypeScript 5.7+ + Next.js 15 (App Router), React 19, Prisma 6, Zod, shadcn/ui, Temporal SDK, @slack/web-api (140-person-document-manager)
- PostgreSQL via Prisma ORM (extend PhysicalPerson, DocumentRequest models; new join table + slot tracker) (140-person-document-manager)
```

**During migration**, the tool copies these per-spec entries directly from `CLAUDE.md` into `constitutions/architecture.md`, preserving the append-per-spec format but wrapping them in Primitiv's frontmatter and re-referencing with Primitiv spec IDs (e.g., `(SPEC-001)` instead of `(133-fix-package-upload-state)`).

**Going forward**, the `/primitiv.implement` command should append a tech stack entry to `constitutions/architecture.md` after completing each spec — listing the stack, database changes, new dependencies, and referencing the spec ID. This keeps the AI agent informed about the project's evolving architecture. This pipeline enhancement is part of this spec (update to `/primitiv.implement`).

### What Does NOT Get Migrated (Requires Manual Setup)

- **Company Principles (Gate 1)** — SpecKit has no equivalent; must be created via `/primitiv.gate-1`
- **Security Principles (Gate 2)** — SpecKit has no equivalent; must be created via `/primitiv.gate-2`
- **Development Constitution (if not embedded)** — If SpecKit's `constitution.md` does not contain a `## Development Principles` section, the dev constitution must be created manually via `/primitiv.constitution development`
- **Claude Code commands** — Must be initialized separately
- **MCP server configuration** — Must be set up separately

## Acceptance Criteria

- [ ] A `/primitiv.migrate` command (or CLI `primitiv migrate speckit`) exists
- [ ] The command detects a SpecKit project by looking for `.specify/` directory and/or SpecKit artifacts in `specs/`
- [ ] If no SpecKit project is detected, the command exits with a clear error message
- [ ] `.specify/memory/constitution.md` is parsed and split: `## Product Principles` → `constitutions/product.md`, `## Development Principles` → `constitutions/development.md`, both with proper Primitiv frontmatter
- [ ] Shared governance sections (Principle Interlock, Unacceptable Risks, Governance, Explicit Exclusions) are preserved in `constitutions/product.md`
- [ ] `CLAUDE.md` is fully copied into `constitutions/architecture.md` with Primitiv frontmatter; per-spec tech stack entries are re-referenced with Primitiv spec IDs via the mapping table
- [ ] Each SpecKit spec (`specs/<NNN>-<slug>/spec.md`) is converted to `SPEC-XXX-<slug>/spec.md` with Primitiv frontmatter
- [ ] SpecKit `checklists/` subdirectories are copied preserving their internal structure
- [ ] SpecKit plans are converted to `SPEC-XXX-<slug>/plan.md` with Primitiv frontmatter
- [ ] SpecKit tasks are converted to `SPEC-XXX-<slug>/tasks.md` with Primitiv frontmatter and status mapping
- [ ] SpecKit `research.md` files are copied to the corresponding Primitiv spec directory
- [ ] SpecKit `data-model.md` files are migrated to `data-model/data-model.md` subdirectory
- [ ] SpecKit `quickstart.md` files are copied to the corresponding Primitiv spec directory
- [ ] SpecKit `contracts/` subdirectories are copied preserving their internal structure
- [ ] `.primitiv/.state.json` is created with `mode: "brownfield"` and `nextSpecId` reflecting the migrated spec count + 1
- [ ] Gates directory is created (`gates/`) with placeholder files or warnings about missing governance
- [ ] A migration report is printed showing: specs migrated, artifacts converted, and manual steps remaining
- [ ] The migration is idempotent — running it twice does not duplicate specs (detects already-migrated state)
- [ ] Original SpecKit files are preserved (not deleted) — migration copies, doesn't move
- [ ] All migrated specs have `status: completed` (brownfield assumption: all existing specs are implemented)
- [ ] Spec IDs are assigned sequentially (SPEC-001, SPEC-002, ...) sorted by original SpecKit number; mapping table included in report
- [ ] Migration merges with pre-existing `.primitiv/` directory: keeps existing gates/constitutions, skips already-migrated specs
- [ ] `/primitiv.implement` command is updated to append a tech stack entry to `constitutions/architecture.md` after each spec completion

## Constraints

- **Non-destructive** — The migration must never delete or modify original SpecKit files. It only reads and creates Primitiv equivalents.
- **Offline** — No network calls required. All data is local filesystem.
- **Incremental** — If new SpecKit specs are added after initial migration, re-running the command should detect and migrate only the new ones.
- **TypeScript implementation** — Follows the dev constitution: strict TypeScript, Zod validation for parsed artifacts, no `any`
- **CLI + Command** — Available both as `primitiv migrate speckit` CLI command and as `/primitiv.migrate` Claude Code command
- **No SpecKit dependency** — The migration tool must not depend on or import SpecKit code. It reads the filesystem directly.

## Out of Scope

- Migration from tools other than SpecKit (e.g., custom spec formats, Jira, Linear)
- Two-way sync between SpecKit and Primitiv
- Automatic creation of gates from SpecKit data
- Migration of git history or branch naming conventions
- SpecKit's creative exploration mode artifacts
- Migration of SpecKit agent configuration or other `.specify/memory/` files beyond `constitution.md`
