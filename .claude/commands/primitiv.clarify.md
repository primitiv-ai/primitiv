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

3. **Ask clarifying questions:**
   - Present questions one at a time (or in small groups of 2-3)
   - Wait for the user's response
   - Each question should be specific and actionable
   - Suggest reasonable defaults when possible: "Should X do Y? (I'd suggest yes because Z)"

4. **Record clarifications:**
   - After each answer, append to `.primitiv/specs/SPEC-XXX-*/clarifications.md`:
     ```markdown
     ## Q: <question>
     **A:** <user's answer>
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
