---
description: "Record or review project learnings"
---

# Record & Review Learnings

You are managing **project learnings** — reusable knowledge captured during development that helps the team avoid repeating mistakes, follow best practices, and maintain conventions.

## Input

The user's input: `$ARGUMENTS`

- If `$ARGUMENTS` is `review`, run **Mode 2: Review Learnings**
- Otherwise, treat `$ARGUMENTS` as a learning description and run **Mode 1: Record a Learning**

---

## Mode 1: Record a Learning

### Instructions

1. **Parse the user's description** to extract the following fields:

   - **`learningType`** — Classify into one of:
     - `"best-practice"` — A pattern or approach that works well and should be repeated
     - `"error-resolution"` — A fix for an error or failure that others may encounter
     - `"convention"` — A team/project convention that should be followed consistently
   - **`title`** — A short, descriptive title (max 80 chars) derived from the description
   - **`description`** — The full description provided by the user
   - **`tags`** — Extract 2-5 relevant tags from the content (lowercase, no spaces, use hyphens). Choose from domain concepts, technologies, and patterns mentioned.
   - **`severity`** — Classify the importance:
     - `"info"` — Nice to know, general guidance
     - `"important"` — Should be followed in most cases, ignoring may cause issues
     - `"critical"` — Must always be followed, ignoring will cause failures or security issues
   - **`source`** — Detect from the conversation context:
     - `"user"` — Default, when the user proactively shares a learning
     - `"gate-failure"` — When recording a learning after a gate check failure
     - `"test-failure"` — When recording a learning after a test failure
     - `"review"` — When recording a learning from a code review
     - `"debug"` — When recording a learning from a debugging session
   - **`specId`** — Detect from the current git branch:
     - If on a `spec/SPEC-XXX-*` branch, extract the spec ID (e.g., `"SPEC-003"`)
     - Otherwise, set to `null`

2. **Read `.primitiv/.state.json`** to get the current state:
   - Look for the `nextLearningId` field
   - If the field does not exist, default to `1` and add it to the state
   - Format the ID as `LEARN-XXX` (zero-padded to 3 digits)
   - Increment `nextLearningId` and save the updated state file

3. **Create the learning file:**
   - Generate a slug from the title (lowercase, hyphens, max 50 chars)
   - Ensure the `.primitiv/learnings/` directory exists (create if needed)
   - Write the file to `.primitiv/learnings/LEARN-XXX-<slug>.md`
   - Use this format:

   ```markdown
   ---
   type: learning
   version: 1
   id: "LEARN-XXX"
   learningType: "<best-practice|error-resolution|convention>"
   title: "<short title>"
   source: "<user|gate-failure|test-failure|review|debug>"
   specId: <spec ID or null>
   tags: ["tag1", "tag2", "tag3"]
   severity: "<info|important|critical>"
   author: "<git user.name>"
   createdAt: "<ISO 8601 timestamp>"
   updatedAt: "<ISO 8601 timestamp>"
   ---

   # <title>

   ## Description

   <full description provided by the user>

   ## Context

   <any additional context — what was happening when this was learned, what spec/task it relates to, what went wrong or right>

   ## Recommendation

   <actionable guidance — what to do or avoid based on this learning>
   ```

4. **Report the result:**

### Output Format (Mode 1)
```
+  Recorded learning LEARN-XXX: <title>
   Type: <learningType>
   Severity: <severity>
   Tags: <tag1>, <tag2>, <tag3>
   File: .primitiv/learnings/LEARN-XXX-<slug>.md

Next steps:
  /primitiv.learn review   -- Review learnings relevant to the current spec
```

---

## Mode 2: Review Learnings

### Instructions

1. **Detect the current spec:**
   - Check the current git branch name
   - If on a `spec/SPEC-XXX-*` branch, extract the spec ID and read the spec from `.primitiv/specs/SPEC-XXX-*/spec.md`
   - If not on a spec branch, review ALL learnings without filtering

2. **Extract keywords from the spec** (if a spec was found):
   - Parse the spec title and description for domain keywords
   - Extract technology names, patterns, and concepts mentioned
   - Collect tags from the spec frontmatter if available

3. **Read all learning files:**
   - Read all `.primitiv/learnings/*.md` files
   - Parse the YAML frontmatter of each learning

4. **Match and rank learnings:**
   - Score each learning by relevance:
     - Tag overlap with spec keywords (highest weight)
     - Same `specId` as current spec (high weight)
     - `severity: "critical"` learnings always surface (high weight)
     - `severity: "important"` learnings get a moderate boost
     - Recency (`createdAt`) used as a tiebreaker
   - Sort by relevance score, descending

5. **Display relevant learnings:**

### Output Format (Mode 2)
```
Learnings relevant to SPEC-XXX: <spec title>
================================================

[CRITICAL] LEARN-005: Always validate env vars at startup
  Type: best-practice | Tags: validation, configuration
  <first line of description>

[IMPORTANT] LEARN-012: Use parameterized queries for all DB access
  Type: convention | Tags: database, security
  <first line of description>

[info] LEARN-003: Prefer early returns over nested conditionals
  Type: best-practice | Tags: code-style, readability
  <first line of description>

---
Showing 3 of 15 learnings (filtered by relevance to SPEC-XXX)
Total learnings in project: 15
```

If no spec is detected:
```
All project learnings
================================================

<list all learnings grouped by severity: critical first, then important, then info>

---
Total learnings in project: <count>
```

If no learnings exist yet:
```
No learnings recorded yet.

Record one with: /primitiv.learn <description>
```
