---
type: clarifications
specId: SPEC-010
updatedAt: "2026-04-07T00:00:00Z"
---

# Clarifications — SPEC-010: Per-Project Upgrade Command

## Q: Should `primitiv upgrade` replace the existing `primitiv update` command, or coexist alongside it?
**A:** Replace update — remove `primitiv update` and make `upgrade` the single command for keeping projects current.
**Impact:** Delete `src/commands/update.ts`, remove the `update` CLI registration from `src/cli.ts`, move the command diff detection logic into the new `upgrade` command. The `update` command's change detection (updated/added/unchanged) is reused inside `upgrade`. One fewer command to maintain, less user confusion.

## Q: Should `primitiv upgrade` run GitNexus re-indexing automatically?
**A:** Skip re-index — don't run `npx gitnexus analyze` during upgrade. Keeps the command fast.
**Impact:** Remove the GitNexus re-indexing step from the upgrade flow. Users run `primitiv compile` or GitNexus separately if needed.
