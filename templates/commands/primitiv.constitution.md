---
description: "Generate or amend a constitution (product, dev, or arch)"
---

# Constitution Management (Gate 3)

You are managing **constitutions** for this project's Spec Driven Development pipeline.

## Input

The user's input after this command: `$ARGUMENTS`

Parse it as: `<type> <action> <description>`
- **type**: `product`, `dev`, or `arch`
- **action**: `generate` (create new) or `amend` (modify existing)
- **description**: Natural language describing the constitution content

Examples:
- `product generate A trading platform for institutional crypto traders`
- `dev generate TypeScript, Next.js, PostgreSQL, deployed on AWS`
- `arch generate microservices with event-driven communication`
- `dev amend switch from Jest to Vitest`

## Instructions

### Product Constitution (`product`):
Write to `.primitiv/constitutions/product.md` with frontmatter:
```yaml
type: product-constitution
version: 1
product:
  name: "<extracted>"
  domain: "<extracted>"
  targetUsers: [<extracted>]
  valueProposition: "<extracted>"
featureRegistry: []
updatedAt: "<now ISO>"
```
Include: product identity, target users, value proposition, positioning.

### Development Constitution (`dev`):
Write to `.primitiv/constitutions/development.md` with frontmatter:
```yaml
type: dev-constitution
version: 1
stack:
  languages: [<extracted>]
  frameworks: [<extracted>]
  databases: [<extracted>]
  infrastructure: [<extracted>]
conventions:
  codeStyle: [<inferred>]
  testing: [<inferred>]
  documentation: [<inferred>]
agentRules: [<generated>]
updatedAt: "<now ISO>"
```
Include: technology stack, code conventions, testing strategy, AI agent rules.

### Architecture Constitution (`arch`):
Write to `.primitiv/constitutions/architecture.md` with frontmatter:
```yaml
type: arch-constitution
version: 1
patterns:
  style: "<extracted>"
  communication: "<extracted>"
  dataFlow: "<extracted>"
boundaries: [<extracted as objects with name, description, owns>]
adrs: []
updatedAt: "<now ISO>"
```
Include: architecture style, communication patterns, data flow, service boundaries.

### For `amend` actions:
1. Read the existing constitution file
2. Apply the requested changes
3. Bump `version` by 1
4. Update `updatedAt`

## Output
- Confirm which constitution was generated/amended
- Show a summary of key decisions
- Suggest next steps
