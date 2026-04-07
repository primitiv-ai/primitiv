---
type: test-results
specId: SPEC-009
version: 1
testTypes:
  - unit
  - integration
summary:
  total: 66
  passed: 66
  failed: 0
  skipped: 0
updatedAt: "2026-04-07T00:00:00Z"
---

# Test Results — SPEC-009: Self-Learning Loop

## Summary

- **66 tests** across 4 test files, all passing
- **0 regressions** (full suite: 313 tests across 25 files)

## Test Files

| File | Tests | Type |
|------|-------|------|
| tests/learningSchema.test.ts | 25 | Unit |
| tests/learning.test.ts | 22 | Unit |
| tests/governanceCompilerLearnings.test.ts | 5 | Integration |
| tests/learnCommand.test.ts | 14 | Integration |

## Acceptance Criteria Coverage

| Feature | Scenario | Then Step | Test File | Status |
|---------|----------|-----------|-----------|--------|
| Learning Record Management | User adds a best practice learning | a file LEARN-001-*.md is created | learning.test.ts | PASS |
| Learning Record Management | User adds a best practice learning | file contains YAML frontmatter with correct fields | learning.test.ts | PASS |
| Learning Record Management | User adds a best practice learning | file contains the description in the markdown body | learning.test.ts | PASS |
| Learning Record Management | User adds a best practice learning | nextLearningId is incremented to 2 | learning.test.ts | PASS |
| Learning Record Management | User adds an error-resolution learning | file LEARN-002-*.md is created | learning.test.ts | PASS |
| Learning Record Management | User adds an error-resolution learning | frontmatter includes specId "SPEC-005" | learning.test.ts | PASS |
| Learning Record Management | User adds an error-resolution learning | nextLearningId is incremented to 3 | learning.test.ts | PASS |
| Learning Record Management | List all learnings | both learnings returned sorted by createdAt desc | learning.test.ts | PASS |
| Learning Record Management | List all learnings | each entry includes id, type, title, severity, tags, createdAt | learning.test.ts | PASS |
| Learning Record Management | Filter learnings by type | only best-practice learnings returned | learning.test.ts | PASS |
| Learning Record Management | Search learnings by keyword | the learning is returned in the results | learning.test.ts | PASS |
| Learning Record Management | Delete a learning by ID | file removed from .primitiv/learnings/ | learning.test.ts | PASS |
| Learning Record Management | Delete a learning by ID | subsequent list calls do not include it | learning.test.ts | PASS |
| Governance Context Integration | Learnings included in compiled context | output JSON contains learnings array | governanceCompilerLearnings.test.ts | PASS |
| Governance Context Integration | Learnings included in compiled context | learning appears with title, description, type, tags | governanceCompilerLearnings.test.ts | PASS |
| Governance Context Integration | Cache invalidated when learnings change | detects learnings have changed and recompiles | governanceCompilerLearnings.test.ts | PASS |
| CLI Learn Command | Add learning via CLI | new learning file created in .primitiv/learnings/ | learnCommand.test.ts | PASS |
| CLI Learn Command | Add learning via CLI | success message printed with learning ID | learnCommand.test.ts | PASS |
| CLI Learn Command | List learnings via CLI | formatted table of learnings displayed | learnCommand.test.ts | PASS |
| CLI Learn Command | List learnings via CLI | table includes columns for ID, Type, Title, Severity, Tags | learnCommand.test.ts | PASS |
| CLI Learn Command | Search learnings via CLI | matching learnings are displayed | learnCommand.test.ts | PASS |
| CLI Learn Command | Remove learning via CLI | learning file is deleted | learnCommand.test.ts | PASS |
| CLI Learn Command | Remove learning via CLI | success message confirms removal | learnCommand.test.ts | PASS |
| CLI Learn Command | Error when no learnings found | "No learnings recorded yet" displayed | learnCommand.test.ts | PASS |
| CLI Learn Command | Error when no learnings found | hint to use primitiv learn add shown | learnCommand.test.ts | PASS |
| Init Integration | Learnings directory created on init | .primitiv/learnings/ created alongside specs, gates | learnCommand.test.ts | PASS |
| Init Integration | Init with existing learnings directory | existing learnings directory preserved | learnCommand.test.ts | PASS |
| Slash Command Integration | AI agent records a learning | N/A (template-only, verified by template content) | — | N/A |
| Slash Command Integration | Relevant learnings surfaced during spec creation | N/A (template-only, verified by template content) | — | N/A |
| Pipeline Learning Surfacing | Relevant learnings shown in pipeline commands | N/A (template-only, verified by template content) | — | N/A |
