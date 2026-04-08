---
type: plan
version: 1
specId: SPEC-012
approach: "Rename gate-1/gate-2 template files and all cross-references; add deprecated command cleanup to upgrade"
fileChanges:
  - path: "templates/commands/primitiv.gate-1.md"
    action: delete
    description: "Old gate-1 template — replaced by primitiv.company-principles.md — Feature: Renamed Slash Commands"
  - path: "templates/commands/primitiv.gate-2.md"
    action: delete
    description: "Old gate-2 template — replaced by primitiv.security-principles.md — Feature: Renamed Slash Commands"
  - path: "templates/commands/primitiv.company-principles.md"
    action: create
    description: "Renamed gate-1 template — same content, new filename — Feature: Renamed Slash Commands"
  - path: "templates/commands/primitiv.security-principles.md"
    action: create
    description: "Renamed gate-2 template — same content, new filename — Feature: Renamed Slash Commands"
  - path: "src/init/templates.ts"
    action: modify
    description: "Update getCommandTemplateNames(): gate-1.md → company-principles.md, gate-2.md → security-principles.md — Feature: Renamed Slash Commands"
  - path: "src/commands/upgrade.ts"
    action: modify
    description: "Add DEPRECATED_COMMANDS array and delete logic after installSlashCommands — Feature: Upgrade Removes Old Commands"
  - path: "src/commands/init.ts"
    action: modify
    description: "Update NEXT_STEPS text and runNonInteractive output: gate-1 → company-principles, gate-2 → security-principles — Feature: Cross-References Updated"
  - path: "src/engine/MigrationManager.ts"
    action: modify
    description: "Update warning messages at lines 651/655: /primitiv.gate-1 → /primitiv.company-principles, /primitiv.gate-2 → /primitiv.security-principles — Feature: Cross-References Updated"
  - path: "templates/commands/primitiv.specify.md"
    action: modify
    description: "Update gate check output format: drop 'Gate N' prefix, use descriptive names only — Feature: Gate Numbers Dropped From Output"
  - path: "templates/commands/primitiv.compile.md"
    action: modify
    description: "Update reference: /primitiv.gate-2 → /primitiv.security-principles — Feature: Cross-References Updated"
  - path: "templates/commands/primitiv.migrate.md"
    action: modify
    description: "Update references: /primitiv.gate-1 → /primitiv.company-principles, /primitiv.gate-2 → /primitiv.security-principles — Feature: Cross-References Updated"
  - path: "templates/specs/README.md"
    action: modify
    description: "Update pipeline diagram and references: gate-1 → company-principles, gate-2 → security-principles — Feature: Cross-References Updated > Scenario: Upgrade regenerates project README"
  - path: "README.md"
    action: modify
    description: "Update How It Works diagram, slash commands table, CLI section, amend examples — Feature: Cross-References Updated > Scenario: README uses new command names"
  - path: "tests/init-wizard.test.ts"
    action: modify
    description: "Update expected command names: primitiv.gate-1.md → primitiv.company-principles.md — Feature: Renamed Slash Commands > Scenario: New command names are available after init"
risks:
  - "Existing users with muscle memory for /primitiv.gate-1 and /primitiv.gate-2 will need to learn new names"
  - "Any external docs or blog posts referencing old names become outdated"
dependencies: []
codebaseAnalysis:
  existingCode:
    - "templates/commands/primitiv.gate-1.md — current gate-1 template"
    - "templates/commands/primitiv.gate-2.md — current gate-2 template"
    - "src/init/templates.ts — getCommandTemplateNames() lists all template files"
    - "src/init/installCommands.ts — iterates getCommandTemplateNames() to install"
    - "src/commands/upgrade.ts — runs installSlashCommands() but has no cleanup logic for deprecated files"
    - "src/commands/init.ts — NEXT_STEPS constant and runNonInteractive() reference gate-1/gate-2"
    - "src/engine/MigrationManager.ts — migrate() warning messages reference gate-1/gate-2"
  reusableModules:
    - "installSlashCommands() already handles installing from template list — just needs the list updated"
    - "upgrade.ts detectChanges() already diffs commands — new names will show as 'added', but old files won't be detected as needing removal (hence DEPRECATED_COMMANDS)"
  patternsToFollow:
    - "Template files in templates/commands/ are the source of truth, installed to .claude/commands/ by installSlashCommands()"
    - "upgrade.ts follows: detect changes → install commands → save state → report summary"
    - "unlinkSync from node:fs for file deletion (not yet imported in upgrade.ts)"
updatedAt: "2026-04-08T13:15:00Z"
---

# Technical Plan — SPEC-012: Rename Gate Commands

## Approach

Pure rename + cleanup. No new features, no schema changes. The gate template files are renamed, all cross-references updated, and the upgrade command gains a `DEPRECATED_COMMANDS` array to delete old files.

## Codebase Analysis

### What exists
- Gate templates at `templates/commands/primitiv.gate-1.md` and `primitiv.gate-2.md`
- `getCommandTemplateNames()` in `src/init/templates.ts` is the single source of truth for which templates get installed
- `installSlashCommands()` in `src/init/installCommands.ts` iterates that list — no changes needed there
- `upgrade.ts` calls `installSlashCommands()` which will install the new names, but has no mechanism to delete old files

### What needs to change
- **2 files renamed** (git mv): template files
- **2 source files modified**: `templates.ts` (list), `upgrade.ts` (add DEPRECATED_COMMANDS + delete logic)
- **1 source file modified**: `init.ts` (NEXT_STEPS output)
- **1 engine file modified**: `MigrationManager.ts` (warning messages)
- **4 template files modified**: `specify.md`, `compile.md`, `migrate.md`, `specs/README.md` (cross-refs)
- **1 project file modified**: `README.md`
- **1 test file modified**: `init-wizard.test.ts`

## File Changes

### 1. Rename template files (git mv)
- `templates/commands/primitiv.gate-1.md` → `templates/commands/primitiv.company-principles.md`
- `templates/commands/primitiv.gate-2.md` → `templates/commands/primitiv.security-principles.md`

### 2. `src/init/templates.ts`
Replace `"primitiv.gate-1.md"` with `"primitiv.company-principles.md"` and `"primitiv.gate-2.md"` with `"primitiv.security-principles.md"` in the `getCommandTemplateNames()` array.

### 3. `src/commands/upgrade.ts`
Add after `installSlashCommands(targetDir)`:
```typescript
import { unlinkSync } from "node:fs";

const DEPRECATED_COMMANDS = ["primitiv.gate-1.md", "primitiv.gate-2.md"];

// Delete deprecated command files
const commandsDir = join(targetDir, ".claude", "commands");
const removed: string[] = [];
for (const name of DEPRECATED_COMMANDS) {
  const filePath = join(commandsDir, name);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
    removed.push(name);
  }
}
```
Add `removed` count to the summary output. Also regenerate `.primitiv/README.md` from template.

### 4. `src/commands/init.ts`
Update `NEXT_STEPS`:
```
1. /primitiv.company-principles generate <company description>
2. /primitiv.security-principles generate <security requirements>
```
Same in `runNonInteractive()`.

### 5. `src/engine/MigrationManager.ts`
Lines 651/655 — update warning messages:
- `"Create company principles: /primitiv.gate-1"` → `"Create company principles: /primitiv.company-principles"`
- `"Create security principles: /primitiv.gate-2"` → `"Create security principles: /primitiv.security-principles"`

### 6. Template cross-references
- `templates/commands/primitiv.specify.md` — drop "Gate N" prefix from output format
- `templates/commands/primitiv.compile.md` — `/primitiv.gate-2` → `/primitiv.security-principles`
- `templates/commands/primitiv.migrate.md` — both gate refs
- `templates/specs/README.md` — pipeline diagram and gate references

### 7. `README.md`
- How It Works diagram: `gate-1` → `company-principles`, `gate-2` → `security-principles`
- Slash commands table: new names
- Amend examples: new names

### 8. `tests/init-wizard.test.ts`
- Lines 45, 58: `"primitiv.gate-1.md"` → `"primitiv.company-principles.md"`

## Architecture

No architectural changes. The rename stays within the existing template → install → upgrade pipeline. The only new concept is `DEPRECATED_COMMANDS` — a simple array in `upgrade.ts`.

## Risks

1. **User muscle memory** — Existing users typing `/primitiv.gate-1` will get "command not found". Mitigated by `primitiv upgrade` cleaning up old files (so there's no ambiguity).
2. **External references** — Blog posts, READMEs in other repos. Can't be auto-updated, but old names were only 1 version old.

## Dependencies

None. No external packages, no schema changes, no state migration.
