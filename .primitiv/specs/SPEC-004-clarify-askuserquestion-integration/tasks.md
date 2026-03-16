---
type: tasks
version: 1
specId: SPEC-004
tasks:
  - id: TASK-001
    title: "Rewrite primitiv.clarify template to mandate AskUserQuestion"
    description: "Rewrite step 3 of the clarify command template to mandate AskUserQuestion tool usage for all questions. Add formatting guidelines (header, options, multiSelect, previews), a concrete example, batching rules, and recording flow. Update both .claude/commands/ and templates/commands/ copies identically."
    status: completed
    files:
      - ".claude/commands/primitiv.clarify.md"
      - "templates/commands/primitiv.clarify.md"
    acceptanceCriteria:
      - "Step 3 mandates AskUserQuestion with MUST/NEVER language"
      - "Template includes header naming guideline (max 12 chars)"
      - "Template includes option design rules (2-4 options, label + description)"
      - "Template includes multiSelect guidance (when to use true vs false)"
      - "Template includes preview guidance (code patterns, config formats, architecture choices)"
      - "Template includes batching guidance (up to 4 related questions per call)"
      - "Template includes recommended option convention (first position + '(Recommended)' suffix)"
      - "Template mentions automatic 'Other' option as always available"
      - "Template includes one concrete AskUserQuestion example"
      - "Template instructs to record 'Other' custom input directly without confirmation"
      - "Recording format preserved: ## Q: / **A:** / **Impact:**"
      - "Both files (.claude/commands/ and templates/commands/) are identical"
      - "Steps 1, 2, 4, 5 and Output section preserved or minimally adapted"
updatedAt: "2026-03-16T16:00:00Z"
---

# Tasks — SPEC-004: Enforce AskUserQuestion Tool in Clarify Command

## TASK-001: Rewrite primitiv.clarify template to mandate AskUserQuestion

**Status:** completed

**Description:**
Rewrite step 3 of the clarify command template to mandate `AskUserQuestion` tool usage for all clarifying questions. Add formatting guidelines, a concrete example, batching rules, and update the recording step to reference the tool response. Update both `.claude/commands/primitiv.clarify.md` and `templates/commands/primitiv.clarify.md` identically.

**Files:**
- `.claude/commands/primitiv.clarify.md`
- `templates/commands/primitiv.clarify.md`

**Acceptance Criteria:**
- [ ] Step 3 mandates AskUserQuestion with MUST/NEVER language
- [ ] Template includes header naming guideline (max 12 chars)
- [ ] Template includes option design rules (2-4 options, label + description)
- [ ] Template includes multiSelect guidance (when to use true vs false)
- [ ] Template includes preview guidance (code patterns, config formats, architecture choices)
- [ ] Template includes batching guidance (up to 4 related questions per call)
- [ ] Template includes recommended option convention (first position + "(Recommended)" suffix)
- [ ] Template mentions automatic "Other" option as always available
- [ ] Template includes one concrete AskUserQuestion example
- [ ] Template instructs to record "Other" custom input directly without confirmation
- [ ] Recording format preserved: `## Q:` / `**A:**` / `**Impact:**`
- [ ] Both files (`.claude/commands/` and `templates/commands/`) are identical
- [ ] Steps 1, 2, 4, 5 and Output section preserved or minimally adapted
