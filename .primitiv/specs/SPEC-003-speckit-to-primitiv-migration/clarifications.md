---
type: clarifications
specId: SPEC-003
version: 1
updatedAt: "2026-03-16T10:30:00Z"
---

# Clarifications — SPEC-003: SpecKit-to-Primitiv Migration

## Q: How should SpecKit spec numbers (e.g., 133, 135, 139, 140) be mapped to Primitiv IDs?
**A:** Sequential re-numbering. SpecKit specs are sorted by original number and assigned SPEC-001, SPEC-002, etc. A mapping table (original → new) is included in the migration report for traceability.
**Impact:** The migration tool must sort SpecKit spec directories by numeric prefix, assign sequential Primitiv IDs, and maintain a mapping table for the architecture.md slug re-referencing and the final report.

## Q: How should the tool detect whether a SpecKit spec is completed vs. in-progress?
**A:** All migrated specs are marked as `status: completed`. Rationale: brownfield migration means all existing SpecKit specs represent already-implemented features in the codebase.
**Impact:** No status detection logic needed. All migrated specs get `status: completed` in their Primitiv frontmatter. Simplifies implementation.

## Q: How should the migration handle non-tech-stack content in CLAUDE.md?
**A:** Copy the full CLAUDE.md content into `constitutions/architecture.md`, wrapping it in Primitiv frontmatter. Additionally, identify per-spec tech stack entries (pattern: `- <entry> (<slug>)`) and re-reference them with Primitiv spec IDs (e.g., `(SPEC-001)` instead of `(133-fix-package-upload-state)`). Non-tech-stack content is preserved as-is.
**Impact:** The tool must: (1) copy full CLAUDE.md content, (2) parse tech stack entry lines using regex to detect the `(<slug>)` suffix pattern, (3) use the spec ID mapping table to replace slugs with Primitiv IDs.

## Q: How should the migration handle a pre-existing `.primitiv/` directory?
**A:** Merge strategy. Detect existing `.primitiv/` content and merge: keep existing gates/constitutions untouched, only add migrated specs and fill in missing constitutions. Update `.state.json` to reflect the merged state.
**Impact:** The tool must check for existing files before writing. If `constitutions/product.md` already exists, skip or warn (don't overwrite). If `.state.json` exists, update `nextSpecId` and set `mode: "brownfield"` while preserving other fields. Migrated specs are only created if they don't already exist.

## Q: How should the tool identify section boundaries when splitting constitution.md?
**A:** Use all detection strategies with a priority cascade: (1) Try H2 header match (`## Product Principles`, `## Development Principles`), (2) Fall back to keyword-based fuzzy match (headers containing "product" or "development" at any heading level), (3) If no recognizable sections found, copy the entire file to `product.md` and warn that dev constitution needs manual creation.
**Impact:** The section parser must implement a multi-strategy approach. The H2 match is tried first (most common). If that fails, scan all heading levels for keyword matches. Final fallback: treat the entire file as product constitution.

## Q: Should the `/primitiv.implement` enhancement (append tech stack entries to architecture.md) be part of SPEC-003?
**A:** Yes, include it in SPEC-003. It's a small change to `primitiv.implement.md` and logically ties into the architecture.md migration story.
**Impact:** SPEC-003 scope includes: (1) the migration command itself, (2) updating `/primitiv.implement` to append a tech stack entry to `constitutions/architecture.md` after completing each spec.
