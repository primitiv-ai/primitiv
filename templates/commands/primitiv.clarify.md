---
description: "Interactive Q&A to resolve spec assumptions"
---

# Clarify Specification

You are running an **interactive clarification session** to resolve assumptions and ambiguities in a spec.

## Input

Optional spec ID: `$ARGUMENTS`
- If empty, detect the current spec from the git branch (must be on a `spec/SPEC-XXX-*` branch)
- If provided, use that spec ID

## Instructions

1. **Load context:**
   - Determine the spec ID (from argument or branch name)
   - Read the spec: `.primitiv/specs/SPEC-XXX-*/spec.md`
   - Read all gates and constitutions for context
   - Read existing clarifications if any: `.primitiv/specs/SPEC-XXX-*/clarifications.md`

2. **Analyze the spec for:**
   - Implicit assumptions that need confirmation
   - Ambiguous requirements that could be interpreted multiple ways
   - Missing edge cases or error scenarios
   - Unstated non-functional requirements (performance, scale, latency)
   - Integration points that need clarification
   - Potential conflicts with gates or constitutions

3. **Ask clarifying questions using `AskUserQuestion`:**

   You MUST use the `AskUserQuestion` tool for **every** clarifying question. Do NOT ask questions as plain text in the conversation. Every question goes through the tool — no exceptions.

   ### Formatting rules

   - **`header`** — Short label (max 12 chars) displayed as a chip. Examples: `"Scope"`, `"Auth method"`, `"Data format"`, `"Error handling"`.
   - **`options`** — 2 to 4 predefined choices. Each option needs:
     - `label`: Concise choice text (1-5 words). If you recommend an option, place it **first** and append `"(Recommended)"` to its label.
     - `description`: What this option means or what happens if chosen.
   - **`multiSelect`** — Set to `true` when multiple answers can apply (e.g., "Which artifact types should be supported?"). Use `false` (default) for mutually exclusive choices.
   - **`preview`** — Optional. Use when comparing concrete artifacts: code snippets, config formats, ASCII mockups, or architecture patterns. Do not use for simple preference questions.
   - **"Other"** — An "Other" option with free-text input is **always available automatically**. You do not need to add it. Users who pick "Other" provide custom text — record it directly without asking for confirmation.

   ### Batching rules

   - Group **up to 4 related questions** in a single `AskUserQuestion` call.
   - Keep **unrelated questions** in separate calls.
   - Continue asking rounds until all ambiguities are resolved — there is no round limit.

   ### Example

   Here is a concrete example of an `AskUserQuestion` call for a clarification session:

   ```json
   {
     "questions": [
       {
         "question": "How should the migration handle specs that already exist in the target directory?",
         "header": "Merge",
         "options": [
           {
             "label": "Skip existing (Recommended)",
             "description": "If a spec already exists in .primitiv/, skip it and report it as already migrated."
           },
           {
             "label": "Overwrite",
             "description": "Replace existing specs with freshly migrated versions from SpecKit."
           },
           {
             "label": "Merge content",
             "description": "Attempt to merge new SpecKit content into existing Primitiv specs."
           }
         ],
         "multiSelect": false
       },
       {
         "question": "Which optional artifact types should be migrated?",
         "header": "Artifacts",
         "options": [
           {
             "label": "All artifacts (Recommended)",
             "description": "Migrate research, data-model, quickstart, contracts, and checklists."
           },
           {
             "label": "Core only",
             "description": "Only migrate spec, plan, and tasks. Skip supplementary artifacts."
           }
         ],
         "multiSelect": false
       }
     ]
   }
   ```

4. **Record clarifications:**
   - After each `AskUserQuestion` response, append each answered question to `.primitiv/specs/SPEC-XXX-*/clarifications.md`:
     ```markdown
     ## Q: <question text>
     **A:** <selected option label — or custom text if user picked "Other">
     **Impact:** <how this affects the spec>
     ```

5. **Update the spec:**
   - After all questions are resolved, update the spec document with resolved assumptions
   - Update the spec status to `clarified` if it was at `gate-3-passed`
   - Update `updatedAt`

## Output
- List the questions asked and answers received
- Summarize how the spec has been refined
- Suggest running `/primitiv.plan` next
