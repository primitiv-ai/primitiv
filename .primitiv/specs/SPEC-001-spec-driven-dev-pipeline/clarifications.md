# Clarifications: SPEC-001 — Spec-Driven Development Pipeline

**Spec**: [spec.md](./spec.md)
**Date**: 2026-03-15

---

## Q: Is this pipeline built as a web application feature or as CLI-driven commands?
**A:** CLI-first. The pipeline operates as slash commands and file-based artifacts in `.primitiv/`. The web UI is a separate future spec that reads these artifacts.
**Impact:** Confirms the current assumption in the spec. No database models, no Server Actions, no UI pages for this spec. All artifacts are files in the repo. Scenario 5 (pipeline status view) will be a CLI command that scans `.primitiv/specs/` directories and reads frontmatter.

## Q: When a gate check fails, can the builder proceed with a documented exception?
**A:** Strict block. Gate failures block progression entirely. The spec or constitutions must be updated to resolve violations.
**Impact:** FR-003 is confirmed as strictly blocking. No override mechanism needed. If a gate fails, the builder must either fix the spec to align with the gate, or amend the constitution/gate if the policy itself needs updating. This aligns with company principle: "No system is Primitive-compliant unless it satisfies all pipeline stages."

## Q: How is the research phase executed?
**A:** AI-driven. The system dispatches AI research agents that analyze the codebase, search documentation, and produce structured decision records autonomously. The builder reviews and validates findings.
**Impact:** FR-004 must specify that research is performed by AI agents, not manually. The research.md is generated automatically with the builder providing review/validation. This increases automation but requires the pipeline to integrate with AI agent orchestration for research tasks.

## Q: Should the system maintain version history for spec updates?
**A:** Git history only. Spec `version` field increments on updates, but diff history is tracked by git commits. No separate versioning system needed.
**Impact:** No changelog section in spec.md, no version files. The `version` field in frontmatter increments on each update. Git commit messages serve as the audit trail for content changes. Simplifies the spec directory structure.

## Q: When the spec ID reaches SPEC-999, should the system auto-expand to 4 digits or cap at 999?
**A:** Auto-expand. Zero-padding is 3 digits minimum but expands naturally (SPEC-1000, SPEC-1001...). No artificial limit.
**Impact:** FR-001 updated: spec IDs use minimum 3-digit zero-padding but are not capped. The formatting logic pads to `Math.max(3, digits_needed)`. No project-level spec limit.

## Q: From which branch should spec branches be created?
**A:** Always from main/master. Spec branches always fork from main to ensure a clean baseline.
**Impact:** FR-008 updated: branch creation must checkout main first, then create the spec branch. Prevents specs from inheriting work-in-progress. The system must detect the default branch name (main vs master).

## Q: For pipeline status (Scenario 5), should the CLI output a table to stdout or generate a markdown file?
**A:** Both. Prints a formatted table to stdout by default, with an `--output` flag to optionally write a markdown report file.
**Impact:** Scenario 5 updated: default behavior is stdout table with `--filter` support. Optional `--output <path>` flag generates a `.primitiv/status.md` markdown file that can be committed and shared.
