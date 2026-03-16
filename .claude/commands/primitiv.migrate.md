---
description: "Migrate a SpecKit project to Primitiv format"
---

# Migrate from SpecKit

You are migrating a **GitHub SpecKit** project to **Primitiv** format.

## Input

Source format: `$ARGUMENTS`
- If empty or "speckit", migrate from SpecKit
- This command only supports SpecKit migration currently

## Instructions

1. **Detect SpecKit project:**
   - Check for `.specify/` directory at project root
   - Check for `specs/` directory with `<NNN>-<slug>/` subdirectories
   - Check for `CLAUDE.md` at project root
   - If none found, exit with error: "No SpecKit project detected"

2. **Run the migration CLI** (preferred if primitiv is installed):
   ```bash
   primitiv migrate speckit
   ```

   Or perform the migration manually:

3. **Migrate constitutions:**
   - Read `.specify/memory/constitution.md`
   - Split into product and development sections:
     - Look for `## Product Principles` → `.primitiv/constitutions/product.md`
     - Look for `## Development Principles` → `.primitiv/constitutions/development.md`
     - If no sections found, try keyword matching at any heading level
     - Shared sections (Principle Interlock, Unacceptable Risks, Governance) go to product.md
   - Wrap each in Primitiv frontmatter
   - Skip if target files already exist

4. **Migrate architecture:**
   - Read `CLAUDE.md` from project root
   - Copy full content to `.primitiv/constitutions/architecture.md`
   - Re-reference per-spec tech stack entries: replace `(NNN-slug)` patterns with `(SPEC-XXX)` using the spec ID mapping
   - Wrap in Primitiv arch-constitution frontmatter

5. **Migrate specs:**
   - Sort SpecKit spec directories by numeric prefix
   - Assign sequential Primitiv IDs: SPEC-001, SPEC-002, etc.
   - For each spec:
     - `spec.md` → Transform frontmatter to Primitiv schema (status: completed)
     - `plan.md` → Transform frontmatter, preserve content
     - `tasks.md` → Transform frontmatter, preserve content
     - `research.md` → Copy directly
     - `data-model.md` → Move to `data-model/data-model.md` subdirectory
     - `quickstart.md` → Copy directly
     - `checklists/` → Copy directory preserving structure
     - `contracts/` → Copy directory preserving structure
   - Skip specs that already exist in `.primitiv/specs/`

6. **Initialize state:**
   - Create/update `.primitiv/.state.json` with `mode: "brownfield"` and `nextSpecId` reflecting the migrated count + 1
   - Create `gates/` directory if missing

7. **Report results:**
   - Show spec ID mapping table (original → Primitiv)
   - Show counts: specs migrated, constitutions created, architecture migrated
   - List manual steps: /primitiv.gate-1, /primitiv.gate-2, development constitution (if missing)

## Output Format
```
Detecting SpecKit project...
  ✓ Found .specify/ directory
  ✓ Found specs/ directory with N specs
  ✓ Found CLAUDE.md

Constitutions:
  ✓ product constitution → .primitiv/constitutions/product.md
  ✓ development constitution → .primitiv/constitutions/development.md
  ✓ CLAUDE.md → .primitiv/constitutions/architecture.md

Specs migrated:
  ✓ SPEC-001 ← 133-fix-package-upload-state
  ✓ SPEC-002 ← 135-operational-dashboard
  ...

Summary: N specs migrated, 2 constitutions, 1 architecture

⚠ Manual steps remaining:
  - Create company principles: /primitiv.gate-1
  - Create security principles: /primitiv.gate-2
```
