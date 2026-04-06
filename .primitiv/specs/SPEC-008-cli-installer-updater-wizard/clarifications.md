---
type: clarifications
specId: SPEC-008
version: 1
updatedAt: "2026-04-06T14:30:00.000Z"
---

# Clarifications — SPEC-008

## Q: What if the npm package name `primitiv` is unavailable?
**A:** Use `primitiv-cli` as the unscoped fallback. User runs `npx primitiv-cli install`.
**Impact:** Package name in spec and package.json may be `primitiv-cli` instead of `primitiv`. The bin name remains `primitiv` so the CLI command is unchanged after global install.

## Q: What should happen when `npx primitiv install` runs outside a git repo?
**A:** Offer to git init — prompt: "No git repo found. Initialize one?" If yes, run `git init` and continue. If no, exit gracefully.
**Impact:** The install/init wizard needs a pre-check step before the main flow that handles missing git repos interactively.

## Q: What version number for the first npm publish?
**A:** 1.0.0 — public launch signals stability and intent.
**Impact:** Bump `package.json` version from 0.2.0 to 1.0.0.

## Q: How to handle `npm install -g` permission failures?
**A:** Catch and guide — if global install fails, show a clear message: "Permission denied. Try: sudo npx primitiv install" or suggest fixing npm permissions. Don't auto-sudo.
**Impact:** The install command needs error handling around the `npm install -g` child process with a helpful fallback message.

## Q: What visual style for the ASCII art banner?
**A:** Gradient color — gradient from one color to another using `gradient-string`. Bold block-character ASCII art.
**Impact:** Confirms `gradient-string` as a dependency. The banner uses Unicode block characters (██) with color gradient applied.

## Q: Should the GitHub repo be renamed?
**A:** Keep `primitiv-spec-engine` as the repo name. npm package is `primitiv-cli` (or `primitiv`). Repo and package names differ.
**Impact:** The `repository` field in package.json points to `primitiv-ai/primitiv-spec-engine`. No repo rename needed.
