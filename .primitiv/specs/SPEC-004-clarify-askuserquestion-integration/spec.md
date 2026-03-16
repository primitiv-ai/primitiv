---
type: spec
id: SPEC-004
title: "Enforce AskUserQuestion Tool in Clarify Command"
status: completed
version: 7
branch: "spec/SPEC-004-clarify-askuserquestion-integration"
author: "Dieu"
createdAt: "2026-03-16T15:30:00Z"
updatedAt: "2026-03-16T15:30:00Z"
---

# SPEC-004: Enforce AskUserQuestion Tool in Clarify Command

## Description

The `/primitiv.clarify` command currently asks clarifying questions as plain text in the conversation. This means the AI agent can present questions in any format — freeform text, numbered lists, inline prompts — and the user must type freeform responses. This is inconsistent and provides a poor developer experience.

### Problem

- Questions are presented as unstructured text, making it easy for the agent to skip waiting for answers or to bundle too many questions at once
- Users must type freeform responses instead of selecting from well-defined options
- There is no structured UI for the clarification flow — it blends into the conversation
- The agent sometimes forgets to wait for a response before moving on
- No option previews, multi-select, or structured annotations are available

### Target State

The `/primitiv.clarify` command template must **explicitly instruct the agent to use the `AskUserQuestion` tool** for every clarifying question. This ensures:

1. **Structured questions** — Each question has a header, 2-4 predefined options with descriptions, and an automatic "Other" escape hatch for custom input
2. **Batched questions** — Up to 4 questions can be asked per `AskUserQuestion` call, with support for grouping related questions
3. **Option previews** — For questions involving code patterns, architecture choices, or configuration formats, the agent can attach preview content to options
4. **Multi-select support** — Questions where multiple answers apply (e.g., "Which artifact types should be migrated?") use `multiSelect: true`
5. **Forced wait** — The tool call mechanism guarantees the agent waits for user input before proceeding
6. **Annotations** — Users can add notes to their selections for additional context

### What Changes

The `/primitiv.clarify` slash command template (both `.claude/commands/primitiv.clarify.md` and `templates/commands/primitiv.clarify.md`) must be updated to:

- **Replace** the current "present questions one at a time or in small groups" instruction with an explicit requirement to use `AskUserQuestion`
- **Add guidelines** for structuring questions: header naming, option design, when to use previews, when to use multi-select
- **Add guidelines** for question batching: group related questions (up to 4) in a single call, keep unrelated questions in separate calls
- **Preserve** the recording step: after each `AskUserQuestion` response, record the Q&A to `clarifications.md` as before
- **Add** a recommended flow: analyze spec → prepare questions → ask via AskUserQuestion → record → repeat until all ambiguities resolved

## Acceptance Criteria

- [ ] `/primitiv.clarify` command template instructs the agent to use `AskUserQuestion` tool for all clarifying questions
- [ ] Template specifies that each question must have a `header` (max 12 chars), 2-4 `options` with `label` and `description`, and appropriate `multiSelect` setting
- [ ] Template includes guidance on when to use `preview` fields (code patterns, config formats, architecture choices)
- [ ] Template includes guidance on batching: group up to 4 related questions per call, separate unrelated questions into distinct calls
- [ ] Template preserves the existing clarification recording format (`## Q: ... / **A:** ... / **Impact:** ...`)
- [ ] Template instructs the agent to suggest a recommended option where applicable (first option + "(Recommended)" suffix)
- [ ] Both `.claude/commands/primitiv.clarify.md` and `templates/commands/primitiv.clarify.md` are updated identically
- [ ] The updated command still works when no options fit — the "Other" escape hatch is mentioned as always available

## Constraints

- **Template-only change** — This spec modifies only the slash command markdown templates, no TypeScript code changes
- **Backward compatible** — The clarify flow still produces the same `clarifications.md` output format
- **No new dependencies** — `AskUserQuestion` is a built-in Claude Code tool, not an external dependency

## Out of Scope

- Adding `AskUserQuestion` to other pipeline commands (specify, plan, etc.)
- Modifying the `AskUserQuestion` tool itself
- Changing the clarifications.md schema or frontmatter format
- Programmatic enforcement (this is prompt-level guidance, not code-level validation)
