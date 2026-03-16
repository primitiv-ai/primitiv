---
type: clarifications
specId: SPEC-002
version: 1
updatedAt: "2026-03-15T10:15:00Z"
---

# Clarifications — SPEC-002: GitNexus Deep Integration

## Q: Should we use `npx gitnexus setup` (auto-install) or manually configure skills and hooks?
**A:** Use `npx gitnexus setup` as the primary installation method. It auto-detects Claude Code and installs MCP config, skills, and hooks automatically.
**Impact:** Simplifies the setup process to a two-step workflow: `npx gitnexus analyze --skills` + `npx gitnexus setup`. No manual skill file creation needed for the core GitNexus skills. Reduces maintenance burden since skills stay current with GitNexus releases.

## Q: Should `/primitiv.specify` and `/primitiv.clarify` also use GitNexus?
**A:** No — only code-touching phases: `/primitiv.plan`, `/primitiv.tasks`, `/primitiv.implement`, `/primitiv.test-feature`, `/primitiv.compushpr`.
**Impact:** Narrows the scope of command modifications to 5 pipeline phases. Specify and clarify remain unchanged.

## Q: How should auto-reindexing work after code changes?
**A:** Use GitNexus's built-in PostToolUse hooks, installed automatically via `npx gitnexus setup`. These re-analyze after git commits.
**Impact:** No custom hook development needed. The `setup` command handles hook installation. The index stays fresh automatically with zero developer friction.

## Q: Should `/primitiv.tasks` use GitNexus for blast radius estimation per task?
**A:** Yes. Use `impact` and `context` tools when breaking down plans into tasks to identify affected files and dependencies per task.
**Impact:** Adds `/primitiv.tasks` to the list of commands requiring GitNexus enhancement. Tasks will include file dependency and blast radius information, improving implementation accuracy.

## Q: Should we enhance existing GitNexus references in plan/implement or rewrite them?
**A:** Enhance existing patterns. Keep the current structure (GitNexus primary + manual fallback) but add more specific guidance on which MCP tool to use at each step.
**Impact:** Less disruption to existing commands. The current graceful degradation pattern (`if GitNexus available → use it, else → manual search`) is preserved and extended to new commands.

## Q: Should `.primitiv/` be un-ignored in `.gitignore` alongside adding `.gitnexus/`?
**A:** No — just add `.gitnexus/` to `.gitignore`. The `.primitiv/` ignore rule is a separate concern outside this spec's scope.
**Impact:** Gitignore change is minimal: one line added. No changes to how `.primitiv/` is handled.
