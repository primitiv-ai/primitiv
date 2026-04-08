---
description: "Generate or amend company principles (Gate 1)"
---

# Gate 1 — Company Principles

You are managing the **company principles** for this project's Spec Driven Development pipeline.

## Input

The user's input after this command: `$ARGUMENTS`

Parse it as: `<action> <description>`
- **action**: `generate` (create new) or `amend` (modify existing)
- **description**: Natural language describing the company, its context, compliance needs, etc.

## Instructions

### If action is `generate`:
1. Read `$ARGUMENTS` to understand the company context
2. Generate a structured company principles document with YAML frontmatter
3. Include: company name, mission, values, compliance requirements, legal constraints, business priorities, boundaries
4. Write the document to `.primitiv/gates/company-principles.md`
5. Use this frontmatter structure:
   ```yaml
   type: company-principles
   version: 1
   company:
     name: "<extracted>"
     mission: "<inferred>"
     values: [<extracted>]
   policies:
     compliance: [<extracted>]
     legal: [<extracted>]
     branding: [<extracted>]
   businessAlignment:
     priorities: [<extracted>]
     boundaries: [<extracted>]
   updatedAt: "<now ISO>"
   ```
6. Write rich prose content under each heading explaining the principles

### If action is `amend`:
1. Read the existing `.primitiv/gates/company-principles.md`
2. Parse the user's amendment request from `$ARGUMENTS`
3. Update the relevant sections (frontmatter + prose)
4. Bump the `version` number by 1
5. Update `updatedAt` timestamp
6. Write the updated document back

## Output
- Confirm what was generated/amended
- Show a summary of the key principles
- Remind the user they can amend with `/primitiv.gate-1 amend <changes>`
