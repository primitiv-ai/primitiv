---
type: clarifications
specId: SPEC-009
updatedAt: "2026-04-07T00:00:00Z"
---

# Clarifications — SPEC-009: Self-Learning Loop

## Q: How should the system determine which learnings are 'relevant' when surfacing them in pipeline commands?
**A:** Tag matching — match learning tags against keywords extracted from the spec title/description.
**Impact:** LearningManager needs a `findRelevant(keywords: string[])` method that matches tags. Pipeline templates extract keywords from spec content and pass them to the matcher.

## Q: Should learning tags be free-form or selected from a predefined taxonomy?
**A:** Free-form — users type any tags they want.
**Impact:** No tag validation or enum needed in the schema. Tags field is `z.array(z.string())` with no constraints. May lead to inconsistency but maximizes flexibility.

## Q: Can learnings be deleted or archived, or are they append-only?
**A:** Deletable — users can delete learnings that are no longer relevant.
**Impact:** LearningManager needs a `delete(id: string)` method that removes the file. CLI needs `primitiv learn remove <id>` subcommand. Slash command template should support deletion.

## Q: Should `primitiv init` create the `.primitiv/learnings/` directory automatically?
**A:** Create on init — add learnings/ to the directory structure created by `primitiv init`.
**Impact:** Update brownfield and greenfield init flows to create `.primitiv/learnings/` alongside `specs/`, `gates/`, `constitutions/`.

## Q: How should learnings appear in the compiled GovernanceContext JSON?
**A:** Flat list — a top-level `learnings` array with all learning records.
**Impact:** GovernanceContextSchema gets a new `learnings` field as `z.array(LearningSchema)`. Simple for AI agents to consume. No need to merge into constraint categories.

## Q: Should `/primitiv.learn` be a single command or split into separate commands?
**A:** Single command — one `/primitiv.learn` with subactions (record a learning, or `review` to show relevant ones).
**Impact:** One slash command template file. Command detects intent from arguments: description text = record, "review" keyword = list relevant learnings.
