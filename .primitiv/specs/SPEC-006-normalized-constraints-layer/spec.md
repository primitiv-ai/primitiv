---
type: spec
id: SPEC-006
title: "Normalized Constraints Layer"
status: completed
version: 1
branch: "spec/SPEC-006-normalized-constraints-layer"
author: "Claude Code"
createdAt: "2026-03-28T00:00:00.000Z"
updatedAt: "2026-03-28T03:00:00.000Z"
---

# SPEC-006: Normalized Constraints Layer

## 1. Description

Extend the `GovernanceContext` produced by SPEC-005's `GovernanceCompiler` with a derived `constraints` field of type `NormalizedConstraints`. This field transforms raw governance inputs (development constitution, architecture constitution, security principles) into a flat, explicit, directly actionable set of constraints that downstream agents can consume without interpretation.

### Problem

SPEC-005 produced a `GovernanceContext` that gives downstream agents access to all governance data in structured form. However, the individual sections (`development`, `architecture`, `security`) remain **descriptive structures** — agents still need to read, interpret, and infer actionable rules from them. For example:

- An agent implementing code must read `development.agentRules`, `development.conventions.codeStyle`, and `development.stack` to derive what it should and should not do
- An agent planning architecture must scan `architecture.patterns`, `architecture.boundaries`, and `security.policies` to understand constraints
- This interpretation step reintroduces ambiguity, inconsistency, and agent-to-agent variation

The goal of deterministic, enforceable governance requires that constraints be **explicit at consumption time, not at interpretation time**.

### Solution

Add a `constraints: NormalizedConstraints` field to `GovernanceContext`, computed during compilation. This field exposes a flat, deduplicated, categorized list of constraints derived mechanically from the existing governance sections. Agents receive constraints they can act on directly.

---

## 2. Acceptance Criteria

- [ ] `GovernanceContextSchema` includes a `constraints` field of type `NormalizedConstraints`
- [ ] `NormalizedConstraints` contains four categories:
  - `tech`: technology and stack constraints (languages, frameworks, databases, infrastructure — from `development.stack`)
  - `code`: coding rules and conventions (from `development.agentRules` + `development.conventions.codeStyle`)
  - `architecture`: architectural patterns and boundaries (from `architecture.patterns` + `architecture.boundaries`)
  - `security`: security policies (from `security.policies.authentication` + `security.policies.dataHandling` + `security.policies.networking` + `security.owaspAlignment`)
- [ ] Each constraint is a `NormalizedConstraint` object: `{ category, rule, source }`
  - `category`: one of `"tech" | "code" | "architecture" | "security"`
  - `rule`: a concise, actionable string (the constraint itself)
  - `source`: the governance section it was derived from (e.g., `"development.agentRules"`)
- [ ] `GovernanceCompiler.compile()` populates `constraints` by extracting and normalizing rules from available governance sections
- [ ] If a governance section is `null` (missing), its derived constraints are simply absent — no error, no warning beyond what SPEC-005 already emits
- [ ] Constraints are deduplicated: identical `rule` strings from different sources appear only once (the first occurrence's `source` is kept)
- [ ] Constraints are deterministically ordered: sorted by `category` (alphabetically) then by `rule` (alphabetically) within each category
- [ ] `COMPILER_VERSION` is bumped from `"1.0"` to `"1.1"` — triggering automatic recompilation via existing staleness detection
- [ ] The injected `## Governance Context` block in downstream agent prompts now includes the `constraints` array so agents can reference it directly
- [ ] Unit tests cover: constraints derived from full governance, constraints with missing sections, deduplication, deterministic ordering, and the `COMPILER_VERSION` bump triggering recompilation

---

## 3. Constraints

- `NormalizedConstraints` is **always present** in `GovernanceContext` (never `null`) — it may be an empty object with all-empty arrays if all governance sections are absent
- Constraint derivation is **purely mechanical**: no LLM inference, no fuzzy matching — constraints are copied verbatim from existing governance arrays and string fields
- The `rule` field is the raw string from the source array (e.g., an entry from `agentRules`) — no reformatting or summarization
- Schema changes must remain **backward-compatible** with downstream consumers: adding `constraints` to the schema must not break existing code that reads other fields
- `COMPILER_VERSION` bump from `"1.0"` to `"1.1"` is intentional — it forces all cached contexts to recompile so they include the new `constraints` field
- TypeScript: strict mode, no `any`, Zod schema as source of truth for the type

---

## 4. Out of Scope

- LLM-based constraint inference or summarization
- Constraint conflict detection or priority ordering
- Runtime enforcement of constraints during code execution
- Constraints derived from company principles or product constitution (those are strategic/philosophical, not directly actionable)
- A UI for browsing or filtering constraints
- Constraint versioning or history tracking

---

## 5. Technical Notes

### NormalizedConstraints Shape

```typescript
type ConstraintCategory = "tech" | "code" | "architecture" | "security";

interface NormalizedConstraint {
  category: ConstraintCategory;
  rule: string;       // Verbatim from source (e.g., an agentRules entry)
  source: string;     // e.g., "development.agentRules", "security.policies.authentication"
}

interface NormalizedConstraints {
  tech: NormalizedConstraint[];
  code: NormalizedConstraint[];
  architecture: NormalizedConstraint[];
  security: NormalizedConstraint[];
}
```

### Derivation Mapping

| Source field | → Category | Notes |
|---|---|---|
| `development.stack.languages` | `tech` | Each entry becomes a constraint |
| `development.stack.frameworks` | `tech` | |
| `development.stack.databases` | `tech` | |
| `development.stack.infrastructure` | `tech` | |
| `development.agentRules` | `code` | The core machine-usable rules list |
| `development.conventions.codeStyle` | `code` | |
| `architecture.patterns.style` | `architecture` | Single string → one constraint |
| `architecture.patterns.communication` | `architecture` | |
| `architecture.patterns.dataFlow` | `architecture` | |
| `architecture.boundaries[].name` | `architecture` | Boundary name as a constraint |
| `security.policies.authentication` | `security` | |
| `security.policies.dataHandling` | `security` | |
| `security.policies.networking` | `security` | |
| `security.owaspAlignment` | `security` | |

### Version Bump

`COMPILER_VERSION` changes from `"1.0"` → `"1.1"`. Any cached `governance-context.json` with `version: "1.0"` will fail the version check in `isStale()` and trigger automatic recompilation — no manual action needed by developers.
