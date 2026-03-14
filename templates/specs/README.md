# Primitiv — Spec Driven Development

This project uses **Primitiv** for Spec Driven Development (SDD).

## Pipeline

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
  │     ├─ /primitiv.clarify  → Interactive Q&A
  │     ├─ /primitiv.plan     → Technical plan (searches codebase)
  │     ├─ /primitiv.tasks    → Task breakdown
  │     └─ /primitiv.implement → Execute tasks
  │
  └─ Done (merge branch)
```

## Directory Structure

- `gates/` — Company and security principles (Gates 1 & 2)
- `constitutions/` — Product, development, and architecture constitutions (Gate 3)
- `specs/` — Feature specifications with plans and tasks
- `.state.json` — Engine metadata and ID counters

## For AI Agents

Read this file to understand the SDD workflow. All documents use YAML frontmatter + markdown.

### Gate Validation Order
1. **Gate 1**: Company principles — business alignment, compliance
2. **Gate 2**: Security principles — auth, data handling, networking
3. **Gate 3**: Constitutions — product fit, dev standards, architecture patterns

### Spec Lifecycle
`draft → gate-1-passed → gate-2-passed → gate-3-passed → clarified → planned → tasked → in-progress → completed`

### CLI Commands
```bash
primitiv validate SPEC-001           # Validate against all gates
primitiv validate SPEC-001 --gate 1  # Validate against specific gate
primitiv status                      # Show all specs
primitiv status SPEC-001             # Show spec details
```
