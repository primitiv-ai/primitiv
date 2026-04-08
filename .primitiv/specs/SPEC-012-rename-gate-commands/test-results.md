---
type: test-results
specId: SPEC-012
version: 1
testTypes: [unit, integration]
summary:
  total: 71
  passed: 71
  failed: 0
  skipped: 0
updatedAt: "2026-04-08T13:10:00Z"
---

# Test Results — SPEC-012: Rename Gate Commands

## Test Suites

| Suite | Tests | Status |
|-------|-------|--------|
| tests/upgrade.test.ts | 14 | PASS |
| tests/init-wizard.test.ts | 18 | PASS |
| tests/migration.test.ts | 32 | PASS |
| tests/stateMachine.test.ts | 7 | PASS |

## Acceptance Criteria Coverage

| Feature | Scenario | Then Step | Test File | Status |
|---------|----------|-----------|-----------|--------|
| Renamed Slash Commands | New command names are available after init | company-principles.md installed | init-wizard.test.ts | PASS |
| Renamed Slash Commands | New command names are available after init | gate-1.md does NOT exist | init-wizard.test.ts | PASS |
| Upgrade Removes Old Commands | Upgrade replaces old gate commands | gate-1.md deleted | upgrade.test.ts | PASS |
| Upgrade Removes Old Commands | Upgrade replaces old gate commands | gate-2.md deleted | upgrade.test.ts | PASS |
| Upgrade Removes Old Commands | Upgrade replaces old gate commands | removed count in summary | upgrade.test.ts | PASS |
| Upgrade Removes Old Commands | Upgrade replaces old gate commands | no error when deprecated files absent | upgrade.test.ts | PASS |
| Upgrade Removes Old Commands | Upgrade regenerates project README | README overwritten from template | upgrade.test.ts | PASS |
| Cross-References Updated | Specify command references new names | init output uses new names | init-wizard.test.ts | PASS |
| Cross-References Updated | Specify command references new names | migration warnings use new names | migration.test.ts | PASS |
| Internal Status Names Unchanged | State machine still uses gate-N-passed | gate-1-passed valid | stateMachine.test.ts | PASS |
| Internal Status Names Unchanged | State machine still uses gate-N-passed | gate-2-passed valid | stateMachine.test.ts | PASS |

## Notes

- `Gate Numbers Dropped From Output` — verified by template inspection (specify.md output format now shows "Company Principles: Passed" without gate numbers). This is a template change validated at the content level, not programmatically testable.
- `README uses new command names` — verified by direct file content (README.md updated). Not a runtime-testable behavior.
- Pre-existing flaky test in `fileSystem.test.ts` is unrelated to SPEC-012.
