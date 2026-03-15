import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getSpecDir, writePrimitivFile } from "../utils/fileSystem.js";
import { parseDocument, serializeDocument } from "../utils/frontmatter.js";
import { ResearchFrontmatterSchema, ResearchDecisionSchema } from "../schemas/research.js";
import type { ResearchFrontmatter, ResearchDecision } from "../schemas/research.js";
import type { ParsedDocument } from "../utils/frontmatter.js";

export interface ResearchValidationResult {
  valid: boolean;
  errors: string[];
}

export class ResearchManager {
  constructor(private projectRoot: string) {}

  createResearchTemplate(specId: string): void {
    const dir = getSpecDir(this.projectRoot, specId);
    const relDir = dir.replace(this.projectRoot + "/.primitiv/", "");

    const data: Record<string, unknown> = {
      type: "research",
      version: 1,
      specId,
      decisions: [],
      updatedAt: new Date().toISOString(),
    };

    const content = `# Research: ${specId}

## Decisions

<!-- Add research decisions in the following format:

### R-001: Decision Title

**Decision**: What was chosen
**Rationale**: Why it was chosen
**Alternatives considered**:
- Alternative 1 → rejected: reason
**Codebase precedent**: Existing pattern (if any)

-->
`;

    const serialized = serializeDocument(data, content);
    const pathSegments = relDir.split("/");
    writePrimitivFile(this.projectRoot, [...pathSegments, "research.md"], serialized);
  }

  readResearch(specId: string): ParsedDocument<ResearchFrontmatter> | null {
    const dir = getSpecDir(this.projectRoot, specId);
    const researchPath = join(dir, "research.md");

    if (!existsSync(researchPath)) return null;

    const raw = readFileSync(researchPath, "utf-8");
    return parseDocument(raw, ResearchFrontmatterSchema);
  }

  validateResearch(specId: string): ResearchValidationResult {
    const doc = this.readResearch(specId);
    if (!doc) {
      return { valid: false, errors: ["research.md not found"] };
    }

    const errors: string[] = [];

    if (doc.data.decisions.length === 0) {
      errors.push("No research decisions found");
    }

    for (const decision of doc.data.decisions) {
      const result = ResearchDecisionSchema.safeParse(decision);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(`${decision.id}: ${issue.path.join(".")} — ${issue.message}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
