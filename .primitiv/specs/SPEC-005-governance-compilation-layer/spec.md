---
type: spec
id: SPEC-005
title: "Governance Compilation Layer"
status: completed
version: 1
branch: "spec/SPEC-005-governance-compilation-layer"
author: "Claude Code"
createdAt: "2026-03-28T00:00:00.000Z"
updatedAt: "2026-03-28T00:00:00.000Z"
---

# SPEC-005: Governance Compilation Layer

## 1. Description

Introduce a **compile step** in the Primitiv SDK pipeline that aggregates all governance inputs — gates (company, security) and constitutions (product, development, architecture) — and transforms them into a single, structured, machine-readable **Governance Context** object.

This compiled context becomes the single source of truth injected into all downstream pipeline stages (plan, tasks, implement), replacing the current pattern where each stage independently re-reads and re-interprets raw markdown documents.

### Problem

Today, every pipeline stage (plan, tasks, implement) independently re-reads governance markdown files and interprets them contextually. This creates:

- **Inconsistency**: Different agents interpret the same rule differently depending on prompt framing
- **Non-determinism**: Outputs vary across runs because governance is embedded in unstructured prose, not enforced constraints
- **High cognitive load**: Each agent must internalize the full governance corpus before performing its task
- **No enforcement**: Violations only surface during review, not at generation time
- **Redundancy**: The same governance documents are parsed repeatedly across every pipeline run

### Solution

A compilation step that runs once per pipeline execution and produces a `GovernanceContext` — a typed, structured object containing all constraints, rules, and principles in a directly machine-usable format. Downstream stages consume the compiled context rather than raw markdown.

---

## 2. Acceptance Criteria

- [ ] `primitiv compile` is available as an explicit CLI/slash command
- [ ] Downstream commands (`plan`, `tasks`, `implement`) automatically invoke `ensureGovernanceContext()` as a pre-flight step; if the context is missing or stale, compilation runs transparently with a one-line notice
- [ ] The compiler reads all governance files from `.primitiv/gates/` and `.primitiv/constitutions/`
- [ ] The compiler extracts **YAML frontmatter only** from each governance file using a YAML parser (no markdown body parsing)
- [ ] The compiler extracts and normalizes from frontmatter:
  - Company principles (values, policies, boundaries, priorities, operatingPrinciples)
  - Security principles (OWASP alignment, authentication, data handling, networking policies)
  - Product constitution (modules, lifecycle states, target users)
  - Development constitution (stack, conventions, agentRules)
  - Architecture constitution (patterns, boundaries, ADRs)
- [ ] The compiled output is written to `.primitiv/governance-context.json`
- [ ] The compiled output includes a `compiledAt` timestamp, a `version` field matching the compiler's schema version, and a `sourceHash` (SHA-256 of all input file contents)
- [ ] On first compile, `.primitiv/governance-context.json` is added to `.gitignore` (or `.primitiv/.gitignore`) if not already present
- [ ] If the cached context's `version` differs from the current compiler version, the context is automatically recompiled with a visible one-line notice
- [ ] If any input file's contents have changed (sourceHash mismatch), the context is automatically recompiled
- [ ] All downstream commands (`plan`, `tasks`, `implement`) inject the full compiled `GovernanceContext` as a structured JSON block at the top of each agent's system prompt
- [ ] If governance sections are partially absent (e.g., no security principles file exists), the compiler produces a context with that section as `null` and emits a prominent warning — it does **not** fail
- [ ] Compilation failures (malformed YAML frontmatter) produce explicit, actionable error messages identifying the offending file and field
- [ ] Unit tests cover: YAML frontmatter parsing for each governance file type, valid context production, staleness detection (hash and version), missing-file warning behavior, and malformed-file error handling

---

## 3. Constraints

- Must not alter the existing governance file format (`.primitiv/gates/*.md`, `.primitiv/constitutions/*.md`) — compilation is a read-only operation on those files
- The compiled output must be deterministic: given the same input files, the output is always identical (no timestamps embedded in the hash, no random ordering)
- The `GovernanceContext` schema must be backward-compatible when new governance fields are added — existing downstream consumers must not break
- Compilation must be fast enough to run in-process before each pipeline command (target: <500ms for typical governance inputs)
- The compiler must gracefully handle partially-defined governance (e.g., no security principles yet) by producing a context with that section empty and a warning, not a hard failure
- No external network calls during compilation — entirely local file system operations
- The TypeScript implementation must comply with the development constitution: strict mode, no `any`, Zod schemas for validation, no silent failures

---

## 4. Out of Scope

- Modifying the content of governance files (compilation is read-only)
- A UI for viewing or editing the compiled governance context
- Runtime governance enforcement during code execution (this spec covers compilation only; enforcement is a future concern)
- Syncing the governance context to a remote registry or database
- Governance diffing or change history tracking
- Multi-tenant or multi-project governance contexts in a single compile run

---

## 5. Technical Notes

### GovernanceContext Shape

```typescript
interface GovernanceContext {
  version: string;                    // Compiler schema version (e.g., "1.0")
  compiledAt: string;                 // ISO 8601 timestamp
  sourceHash: string;                 // SHA-256 of all input file contents (deterministic)
  company: CompanyPrinciples | null;
  security: SecurityPrinciples | null;
  product: ProductConstitution | null;
  development: DevelopmentConstitution | null;
  architecture: ArchitectureConstitution | null;
  warnings: CompilationWarning[];     // Non-fatal issues (missing files, unknown fields)
}
```

Each sub-type is derived from the **YAML frontmatter only** of its source document, validated by a Zod schema. The markdown prose body is not parsed or stored.

### Staleness Detection

Two conditions trigger automatic recompilation:
1. `sourceHash` in the cached context differs from a freshly computed hash of current input files
2. `version` in the cached context differs from the current `COMPILER_VERSION` constant

If `.primitiv/governance-context.json` does not exist, compile fresh without notice.

### Pipeline Integration

The CLI layer calls `ensureGovernanceContext()` before dispatching to any downstream command. This function: checks staleness → recompiles if needed (with a one-line notice) → returns the `GovernanceContext`. The context is then serialized as a JSON block and prepended to the agent's system prompt in full, for every downstream command.

```
## Governance Context
```json
{ "version": "1.0", "company": { ... }, "security": { ... }, ... }
```
> Compiled 2026-03-28 · hash: a3f9c1...
```

Pipeline commands receive the `GovernanceContext` as a typed parameter (dependency injection) to keep them testable in isolation with a mock context.

### File: `.primitiv/governance-context.json`

Generated artifact — not authored. Added to `.gitignore` on first compile. Developers regenerate it locally by running `primitiv compile` or any downstream command. The file must never be hand-edited.
