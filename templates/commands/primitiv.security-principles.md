---
description: "Generate or amend security principles (Gate 2)"
---

# Gate 2 — Security Principles

You are managing the **security principles** for this project's Spec Driven Development pipeline.

## Input

The user's input after this command: `$ARGUMENTS`

Parse it as: `<action> <description>`
- **action**: `generate` (create new) or `amend` (modify existing)
- **description**: Natural language describing security requirements, policies, compliance needs

## Instructions

### If action is `generate`:
1. Read `$ARGUMENTS` to understand the security context
2. Generate a structured security principles document with YAML frontmatter
3. Include: authentication policies, data handling rules, dependency management, network security, OWASP alignment
4. Write the document to `.primitiv/gates/security-principles.md`
5. Use this frontmatter structure:
   ```yaml
   type: security-principles
   version: 1
   policies:
     authentication: [<extracted>]
     dataHandling: [<extracted>]
     dependencies: [<extracted>]
     networking: [<extracted>]
   owaspAlignment: [<extracted>]
   updatedAt: "<now ISO>"
   ```
6. Write detailed prose content explaining each security policy

### If action is `amend`:
1. Read the existing `.primitiv/gates/security-principles.md`
2. Parse the user's amendment request from `$ARGUMENTS`
3. Update the relevant sections (frontmatter + prose)
4. Bump the `version` number by 1
5. Update `updatedAt` timestamp
6. Write the updated document back

## Output
- Confirm what was generated/amended
- Show a summary of security policies
- Remind the user they can amend with `/primitiv.gate-2 amend <changes>`
