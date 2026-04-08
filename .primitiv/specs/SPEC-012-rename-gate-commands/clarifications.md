---
type: clarifications
specId: SPEC-012
updatedAt: "2026-04-08T13:10:00Z"
---

# Clarifications — SPEC-012

## Q: The upgrade command needs to delete the old gate-1/gate-2 files. Should this be a hardcoded list of deprecated commands, or a generic mechanism for future renames?
**A:** Hardcoded list
**Impact:** Add a simple `DEPRECATED_COMMANDS` array in `upgrade.ts` with `['primitiv.gate-1.md', 'primitiv.gate-2.md']`. No generic rename infrastructure needed.

## Q: The `.primitiv/README.md` in each project references gate-1/gate-2. Should upgrade also patch that file, or leave it as-is?
**A:** Patch it
**Impact:** `primitiv upgrade` must regenerate `.primitiv/README.md` from the template. The `templates/specs/README.md` template must be updated with the new names, and upgrade must overwrite the installed copy.

## Q: The specify command output currently says 'Gate 1 (Company Principles): Passed'. Should the output also drop the 'Gate 1' prefix?
**A:** Drop gate numbers
**Impact:** All gate check output in the specify template becomes `Company Principles: Passed`, `Security Principles: Passed`, `Constitutions: Passed`. No numbered gate references in user-facing output.
