---
type: clarifications
specId: SPEC-005
updatedAt: "2026-03-28T00:00:00.000Z"
---

# Clarifications — SPEC-005: Governance Compilation Layer

## Q: How should the compiled GovernanceContext be delivered to downstream agents?
**A:** Inject into prompt — serialize the compiled context as a structured JSON block and prepend it to each agent's system prompt.
**Impact:** The compiled context is explicitly embedded in agent prompts as structured data (not raw markdown). Downstream skill files (plan, tasks, implement) must include a prompt template section that inserts the serialized `GovernanceContext` JSON before the task-specific instructions.

---

## Q: What should the compiler extract from governance files?
**A:** YAML frontmatter only — parse only the structured YAML frontmatter block. Markdown prose is excluded from the compiled context.
**Impact:** Simplifies the compiler implementation significantly. The compiler uses a YAML parser (not a markdown parser) to extract data. Rich prose descriptions from the markdown body are not included. This means the frontmatter of each governance file must be the authoritative, machine-readable representation of all rules.

---

## Q: Should `primitiv compile` be exposed as a standalone CLI command?
**A:** Both standalone + auto — expose `primitiv compile` as a direct command AND trigger it automatically before plan/tasks/implement when the context is missing or stale.
**Impact:** Two integration points: (1) a `compile` slash command/CLI entry point for explicit use, and (2) automatic compilation as a pre-flight check in plan, tasks, and implement commands. Downstream commands must call `ensureGovernanceContext()` at their start.

---

## Q: Should `.primitiv/governance-context.json` be gitignored by default?
**A:** Gitignored by default — treat as a derived build artifact. Each developer regenerates locally.
**Impact:** The compiler must add `.primitiv/governance-context.json` to `.gitignore` (or `.primitiv/.gitignore`) on first compile if not already present. Documentation and error messages should clarify that the file is generated, not authored.

---

## Q: How much of the GovernanceContext should be injected into each agent's prompt?
**A:** Full context always — inject the entire compiled GovernanceContext into every downstream agent.
**Impact:** No filtering logic needed. Every agent sees all governance sections regardless of task type. This maximizes rule visibility at the cost of additional prompt tokens. All five sections (company, security, product, development, architecture) are always included.

---

## Q: When downstream command runs with partially missing governance, how should it behave?
**A:** Warn and proceed — log a visible warning listing missing sections, then continue.
**Impact:** Missing governance does not block pipeline execution. Warnings must be prominently displayed (not buried in debug logs). The spec must not add a hard-failure path for missing governance files — null sections in the GovernanceContext are acceptable. Users are encouraged but not forced to generate missing governance documents.

---

## Q: How should a stale cached context (schema version mismatch) be handled?
**A:** Auto-recompile on mismatch — if cached context has a different schema version, automatically recompile with a one-line notice to the user.
**Impact:** No manual intervention needed on schema upgrades. The compiler checks `context.version` against `COMPILER_VERSION` constant at load time. If they differ, recompile silently (with a visible notice). This means governance source files must still exist at recompile time — if they've been deleted, this becomes an error.
