---
type: spec
id: SPEC-001
title: "Spec-Driven Development Pipeline"
status: completed
version: 4
branch: "spec/SPEC-001-spec-driven-dev-pipeline"
author: "Dieu"
createdAt: "2026-03-15T00:00:00Z"
updatedAt: "2026-03-15T10:48:00Z"
---

# SPEC-001: Spec-Driven Development Pipeline

## Description

The Primitive Platform requires a structured development pipeline that transforms feature ideas into production-ready software through a series of governed stages. This pipeline is the core workflow engine of the platform, orchestrating the journey from initial idea capture through specification, research, planning, task breakdown, implementation, testing, and deployment.

The pipeline ensures that no system is built without a formal specification, no implementation begins without research and planning, and no code reaches production without verification. Each stage produces structured artifacts that serve as inputs to the next stage, creating a deterministic and auditable development process.

This feature delivers the foundational pipeline that all subsequent features will flow through.

## Problem Statement

Software development inside organizations is typically improvised: ideas go directly to code, specifications are informal or missing, architectural decisions are undocumented, and there is no structured research phase to resolve unknowns before implementation. This leads to rework, inconsistent quality, hidden technical debt, and systems that cannot be maintained.

Builders need a structured pipeline that enforces discipline without slowing them down — one that captures decisions, resolves unknowns through research, and produces artifacts at each stage that feed into the next.

## Target Users

- **Builders**: Engineers, product teams, and domain experts who create software systems within an organization
- **Technical leads**: Reviewers who validate specs, plans, and implementations against organizational standards
- **Organization administrators**: Leadership that needs visibility into what is being built, by whom, and at what stage

## User Scenarios & Acceptance Criteria

### Scenario 1: Creating a New Specification

**As a** builder, **I want to** describe a feature in natural language **so that** the system generates a structured specification with all required sections.

**Acceptance Criteria:**
- [ ] Builder provides a natural language feature description
- [ ] System generates a unique spec ID (SPEC-XXX format, zero-padded)
- [ ] System creates a dedicated directory for the spec at `.primitiv/specs/SPEC-XXX-<slug>/`
- [ ] Spec directory contains: `spec.md`, `contracts/`, `data-model/`, `checklists/`
- [ ] The generated spec includes: description, problem statement, user scenarios, acceptance criteria, functional requirements, success criteria, assumptions, and scope boundaries
- [ ] Spec is written for non-technical stakeholders (no implementation details)
- [ ] System runs gate checks against company principles, security principles, and constitutions
- [ ] Gate check results are reported to the builder with pass/warn/fail status
- [ ] A git branch is created: `spec/SPEC-XXX-<slug>`
- [ ] The global state counter (`nextSpecId`) is incremented

### Scenario 2: Clarifying Spec Requirements

**As a** builder, **I want to** resolve ambiguities in a specification through structured Q&A **so that** the spec is complete and unambiguous before planning begins.

**Acceptance Criteria:**
- [ ] System identifies all `[NEEDS CLARIFICATION]` markers in the spec
- [ ] Each ambiguity is presented with context, the specific question, and suggested answer options
- [ ] Builder selects from suggested options or provides a custom answer
- [ ] System updates the spec by replacing clarification markers with resolved answers
- [ ] Maximum 3 clarification questions per round (prioritized by scope > security > UX impact)
- [ ] System re-validates the spec after all clarifications are resolved

### Scenario 3: Generating a Technical Plan with Research

**As a** builder, **I want to** generate a technical implementation plan that includes a research phase **so that** all unknowns are resolved before implementation begins.

**Acceptance Criteria:**
- [ ] System reads the validated spec and all constitutions (product, dev, architecture)
- [ ] System identifies technical unknowns and marks them as "NEEDS CLARIFICATION"
- [ ] System performs a constitution check validating alignment with all gates
- [ ] **Phase 0 — Research**: System generates `research.md` in the spec directory with:
  - Research tasks extracted from each "NEEDS CLARIFICATION" item
  - Best practices research for each technology choice in the domain context
  - Integration patterns research for each external dependency
  - Each finding documented as: Decision, Rationale, Alternatives Considered, Codebase Precedent (if applicable)
  - All "NEEDS CLARIFICATION" items resolved after research
- [ ] **Phase 1 — Design & Contracts**: After research is complete, system generates:
  - `data-model/data-model.md`: Entity definitions with fields, relationships, validation rules, and state transitions
  - `contracts/api.yaml`: OpenAPI specification for any external-facing interfaces
  - A quickstart summary of the implementation approach
- [ ] System re-evaluates constitution checks after design artifacts are produced
- [ ] Gate violations produce errors that block progression

### Scenario 4: Breaking a Plan into Tasks

**As a** builder, **I want to** break down a technical plan into discrete, ordered implementation tasks **so that** work can be tracked and executed incrementally.

**Acceptance Criteria:**
- [ ] System reads the completed plan (with research and design artifacts)
- [ ] System generates a list of implementation tasks, each with:
  - Unique task ID
  - Title and description
  - Dependencies on other tasks (ordering)
  - Acceptance criteria specific to the task
  - Estimated scope (small / medium / large)
- [ ] Tasks follow the TDD workflow: test tasks precede or are bundled with implementation tasks
- [ ] Tasks are atomic — each produces a single, focused, reviewable change
- [ ] Task list is written to the spec directory

### Scenario 5: Viewing Pipeline Status

**As an** organization administrator, **I want to** see the status of all specs in the pipeline **so that** I can understand what is being built and where each feature stands.

**Acceptance Criteria:**
- [ ] CLI command prints a formatted table to stdout showing all specs with their current status
- [ ] Status values include: `draft`, `clarifying`, `planning`, `researching`, `ready`, `in-progress`, `testing`, `review`, `deployed`, `archived`
- [ ] Each spec shows: ID, title, author, current status, branch, creation date, last update
- [ ] Specs can be filtered by status via a `--filter` flag
- [ ] Optional `--output <path>` flag generates a markdown report file that can be committed and shared

## Functional Requirements

### FR-001: Spec ID Generation
The system must generate unique, sequential spec IDs in the format `SPEC-XXX` (minimum 3-digit zero-padding, auto-expanding for IDs above 999). The next available ID is tracked in `.primitiv/.state.json` and incremented atomically after each spec creation. There is no upper limit on spec IDs.

### FR-002: Spec Directory Structure
Each spec must have its own directory at `.primitiv/specs/SPEC-XXX-<slug>/` containing:
- `spec.md` — the specification document
- `contracts/` — OpenAPI contract files (YAML format)
- `data-model/` — data model documentation
- `checklists/` — quality validation checklists
- `research.md` — research findings (generated during planning phase)

### FR-003: Gate Checks
Every spec must be validated against three gates before progressing:
- **Gate 1 (Company Principles)**: Alignment with mission, values, priorities, boundaries
- **Gate 2 (Security Principles)**: Compliance with authentication, data handling, networking, OWASP policies
- **Gate 3 (Constitutions)**: Compatibility with product scope, architecture patterns, development conventions

Gate checks produce pass/warn/fail results. Failures strictly block progression with specific violation details — no override mechanism exists. The builder must either fix the spec to align with the gate, or amend the constitution/gate document if the policy itself needs updating. Missing gate documents produce warnings but do not block.

### FR-004: Research Phase
The planning workflow must include a mandatory research phase (Phase 0) executed by AI agents:
- AI agents autonomously analyze the codebase, search documentation, and research best practices
- Extracts all unknowns from the technical context and generates research tasks
- For each unknown, dependency, and integration, an AI research agent investigates and produces findings
- Produces a `research.md` document with structured decision records
- Each decision record follows the format: Decision, Rationale, Alternatives Considered, Codebase Precedent
- The builder reviews and validates AI-generated research findings
- Research must resolve all "NEEDS CLARIFICATION" items before design begins

### FR-005: Design Artifacts
After research completes, the planning workflow must produce:
- Data model documentation with entity definitions, fields, relationships, validation rules
- OpenAPI contract files (YAML) for any external-facing interfaces in the `contracts/` directory
- A quickstart guide summarizing the implementation approach

### FR-006: Task Generation
The system must decompose a plan into ordered implementation tasks. Tasks must be atomic, have clear dependencies, include acceptance criteria, and follow the TDD workflow (tests first).

### FR-007: Audit Trail
Every pipeline stage transition must produce an audit record capturing: actor, action, spec ID, previous status, new status, timestamp.

### FR-008: Branch Management
Each spec must have a dedicated git branch created automatically from the project's default branch (main/master). The system must detect the default branch, checkout it first, then create and checkout the spec branch. Branch naming follows: `spec/SPEC-XXX-<slug>`. This ensures spec branches always have a clean baseline and do not inherit work-in-progress from other branches.

## Success Criteria

- SC-001: A builder can go from a natural language idea to a structured spec in under 5 minutes
- SC-002: 100% of specs pass through all three gates before implementation begins
- SC-003: Every plan includes a completed research.md with all unknowns resolved before design
- SC-004: Each spec directory contains contracts (OpenAPI YAML) and data-model artifacts after planning
- SC-005: Task breakdown produces atomic, TDD-ordered tasks covering all spec acceptance criteria
- SC-006: Organization administrators can view the status of all specs at any time
- SC-007: Zero specs reach implementation without passing gate checks
- SC-008: Every stage transition is auditable with actor, action, and timestamp

## Scope

### In Scope
- Spec creation from natural language with ID generation and directory structure
- Gate checks against company principles, security principles, and constitutions
- Clarification workflow for resolving spec ambiguities
- Planning workflow with mandatory research phase (research.md)
- Design artifact generation: data models and OpenAPI contracts
- Task breakdown from completed plans
- Pipeline status tracking across all specs
- Git branch management per spec
- Audit trail for stage transitions

### Out of Scope
- Code generation / implementation execution (separate spec)
- CI/CD pipeline execution (separate spec)
- Deployment management (separate spec)
- Review engine / automated code review (separate spec)
- User authentication and access control for the platform UI (separate spec)
- Notification system (separate spec)
- Real-time collaboration on specs

## Assumptions

- The pipeline operates locally via CLI commands (platform UI is a separate spec) — **clarified**
- Git is available and initialized in the project repository
- The `.primitiv/` directory structure is initialized before first spec creation
- Constitutions and gate documents may not exist yet — the pipeline warns but does not block if they are missing
- Gate failures strictly block progression — no override mechanism; fix the spec or amend the gate — **clarified**
- A single builder works on a spec at a time (concurrent editing is out of scope)
- The pipeline artifacts (specs, research, contracts, data models) are stored as files in the repository, not in a database
- OpenAPI contracts are generated only when the spec involves external-facing interfaces; purely internal features skip contract generation
- Research is performed autonomously by AI agents; the builder reviews and validates findings — **clarified**
- Spec version history is tracked by git commits; no separate versioning files or changelog sections — **clarified**
- Spec branches are always created from the project's default branch (main/master) — **clarified**
- Spec IDs auto-expand beyond 3 digits when exceeding 999 — **clarified**

## Dependencies

- Git (branch creation and management)
- `.primitiv/.state.json` (spec ID tracking)
- `.primitiv/gates/` (company principles, security principles)
- `.primitiv/constitutions/` (product, architecture, development constitutions)

## Key Entities

- **Spec**: The specification document with ID, title, status, version, and associated artifacts
- **Gate Check Result**: The outcome of validating a spec against a gate (pass/warn/fail with details)
- **Research Decision**: A structured finding from the research phase (decision, rationale, alternatives, precedent)
- **Design Artifact**: Data model or API contract produced during the planning phase
- **Task**: An atomic implementation unit with ID, description, dependencies, and acceptance criteria
- **Pipeline State**: The global state tracking next IDs and project configuration
