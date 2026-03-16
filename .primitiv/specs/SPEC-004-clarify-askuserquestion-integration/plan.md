---
type: plan
version: 1
specId: SPEC-004
approach: "Replace freeform question instructions in primitiv.clarify template with mandatory AskUserQuestion tool usage, including formatting guidelines and a concrete example"
fileChanges:
  - path: ".claude/commands/primitiv.clarify.md"
    action: modify
    description: "Rewrite step 3 (Ask clarifying questions) to mandate AskUserQuestion tool. Add tool usage guidelines, example, and recording flow."
  - path: "templates/commands/primitiv.clarify.md"
    action: modify
    description: "Identical update — keep templates/ and .claude/commands/ in sync."
risks:
  - "Agent may still fall back to plain text if the prompt is not explicit enough — mitigate with strong MUST language and capitalized emphasis"
  - "AskUserQuestion requires 2-4 options — agent may struggle with highly domain-specific questions where options are hard to formulate"
dependencies: []
codebaseAnalysis:
  existingCode:
    - ".claude/commands/primitiv.clarify.md — current clarify template with freeform question instructions"
    - "templates/commands/primitiv.clarify.md — identical copy for distribution"
  reusableModules: []
  patternsToFollow:
    - "Tool reference style from primitiv.plan.md and primitiv.test-feature.md — bullet lists with tool name + description"
    - "Template structure: frontmatter description + title + Input + Instructions (numbered) + Output"
updatedAt: "2026-03-16T15:55:00Z"
---

# Plan — SPEC-004: Enforce AskUserQuestion Tool in Clarify Command

## Approach

Rewrite the `/primitiv.clarify` command template to replace the freeform "present questions one at a time" instruction with a mandatory `AskUserQuestion` tool workflow. The template will include:

1. **Explicit tool mandate** — Step 3 rewritten to require `AskUserQuestion` for every question, no exceptions
2. **Formatting guidelines** — How to structure headers, options, descriptions, multiSelect, and previews
3. **Concrete example** — One full `AskUserQuestion` call showing the expected JSON structure
4. **Recording flow** — After each tool response, record Q&A to `clarifications.md` (unchanged format)
5. **Batching guidance** — Group up to 4 related questions per call, separate unrelated ones

## File Changes

### 1. `.claude/commands/primitiv.clarify.md` (modify)

**What changes:**
- Step 3 ("Ask clarifying questions") is fully rewritten:
  - Remove: "Present questions one at a time (or in small groups of 2-3)" and "Wait for the user's response"
  - Add: Mandatory `AskUserQuestion` usage with formatting rules
  - Add: Guidelines for header naming (max 12 chars), option design (2-4 per question, label + description), multiSelect usage, and preview usage
  - Add: Instruction to suggest a recommended option (first position + "(Recommended)" suffix)
  - Add: Note that "Other" is always available automatically
- New sub-step: Concrete example of an `AskUserQuestion` call
- Step 4 ("Record clarifications") updated to reference tool response format instead of generic "user's response"

**What stays the same:**
- Frontmatter, title, Input section
- Steps 1, 2, 5 (Load context, Analyze spec, Update spec)
- The `clarifications.md` output format (Q/A/Impact)
- Output section

### 2. `templates/commands/primitiv.clarify.md` (modify)

Identical content to `.claude/commands/primitiv.clarify.md` — exact copy.

## Architecture

No architectural changes. This is a prompt template modification only. The `AskUserQuestion` tool is a built-in Claude Code tool — no imports, dependencies, or code changes needed.

## Risks

| Risk | Mitigation |
|---|---|
| Agent ignores tool mandate and asks freeform | Use strong "MUST" / "NEVER" language with emphasis. Add explicit "Do NOT ask questions as plain text" instruction. |
| Hard to formulate options for domain-specific questions | Instruct agent to always propose reasonable defaults. Built-in "Other" option covers edge cases. |

## Test Strategy

Since this is a template-only change, testing is verification-based:
- Verify both files are updated identically
- Verify the template includes `AskUserQuestion` tool name
- Verify the template includes a concrete example
- Verify the clarifications.md format is preserved
- Verify the `/primitiv.implement` template reference in `getCommandTemplateNames()` is not affected
