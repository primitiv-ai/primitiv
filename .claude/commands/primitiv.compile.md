---
description: "Compile governance files into a structured GovernanceContext"
---

# Compile Governance Context

You are compiling all governance inputs into a structured, machine-readable **GovernanceContext** that will be injected into downstream pipeline stages.

## Input

Optional project directory: `$ARGUMENTS`
- If empty, use the current directory

## Instructions

1. **Run the compiler:**
   - Execute: `npx primitiv compile` (or `primitiv compile` if installed globally)
   - The compiler reads `.primitiv/gates/` and `.primitiv/constitutions/` — YAML frontmatter only
   - Output is written to `.primitiv/governance-context.json` (gitignored)

2. **Display results:**
   For each of the 5 governance sections, show its status:
   ```
   ✓ company       — company-principles.md found and parsed
   ✓ security      — security-principles.md found and parsed
   ✓ product       — product.md found and parsed
   ✓ development   — development.md found and parsed
   ✓ architecture  — architecture.md found and parsed
   ```
   Or if a section is missing:
   ```
   ⚠ security      — not found (generate with /primitiv.gate-2)
   ```

3. **Show compilation summary:**
   ```
   ✓ Governance context compiled
     Hash:   <first 8 chars of sourceHash>...
     File:   .primitiv/governance-context.json (gitignored)
     Warnings: <N> (or "none")
   ```

4. **Print any warnings** with `⚠` prefix — these are non-blocking but should be addressed.

5. **Report stale-cache behavior** (if applicable):
   - If the compiler detected a version mismatch or changed files, note that it recompiled automatically.

## Output format

```
Compiling governance context...

  ✓ company        — Primitive (company-principles.md)
  ✓ security       — security-principles.md
  ⚠ product        — not found (generate with /primitiv.constitution product)
  ✓ development    — development.md
  ✓ architecture   — architecture.md

✓ Governance context compiled
  Hash:     a3f9c1d2...
  File:     .primitiv/governance-context.json (gitignored)
  Warnings: 1

  ⚠ Product constitution not found — downstream agents will receive null for this section.
    Generate it with: /primitiv.constitution product

Next steps:
  /primitiv.plan        — Generate technical implementation plan (uses compiled context)
  /primitiv.implement   — Execute implementation tasks (uses compiled context)
```

## Notes

- The compiled context is a **cache** — it is always regenerated from source governance files
- It is **gitignored** by default — each developer runs `primitiv compile` locally
- Downstream commands (`/primitiv.plan`, `/primitiv.tasks`, `/primitiv.implement`) read this file automatically and inject it into agent prompts
- If you modify any governance file, re-run `/primitiv.compile` to refresh the context
