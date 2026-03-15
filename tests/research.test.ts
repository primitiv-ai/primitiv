import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ResearchDecisionSchema, ResearchFrontmatterSchema } from "../src/schemas/research.js";
import { ResearchManager } from "../src/engine/ResearchManager.js";

function createTempProject(specId = "SPEC-001"): string {
  const root = mkdtempSync(join(tmpdir(), "primitiv-research-"));
  mkdirSync(join(root, ".primitiv", "specs", `${specId}-test`), { recursive: true });
  writeFileSync(join(root, ".primitiv", ".state.json"), JSON.stringify({ nextSpecId: 2 }));
  return root;
}

describe("ResearchDecisionSchema", () => {
  it("validates a complete decision", () => {
    const decision = ResearchDecisionSchema.parse({
      id: "R-001",
      title: "Database choice",
      decision: "PostgreSQL",
      rationale: "Best fit for relational data",
      alternativesConsidered: ["MongoDB → rejected: no relational support"],
      codebasePrecedent: null,
    });
    expect(decision.id).toBe("R-001");
  });

  it("rejects invalid ID format", () => {
    expect(() =>
      ResearchDecisionSchema.parse({
        id: "BAD-001",
        title: "Test",
        decision: "test",
        rationale: "test",
        alternativesConsidered: ["alt"],
      }),
    ).toThrow();
  });

  it("requires at least one alternative", () => {
    expect(() =>
      ResearchDecisionSchema.parse({
        id: "R-001",
        title: "Test",
        decision: "test",
        rationale: "test",
        alternativesConsidered: [],
      }),
    ).toThrow();
  });

  it("defaults codebasePrecedent to null", () => {
    const result = ResearchDecisionSchema.parse({
      id: "R-001",
      title: "Test",
      decision: "test",
      rationale: "reason",
      alternativesConsidered: ["alt1"],
    });
    expect(result.codebasePrecedent).toBeNull();
  });
});

describe("ResearchFrontmatterSchema", () => {
  it("parses research frontmatter", () => {
    const data = {
      type: "research",
      specId: "SPEC-001",
      decisions: [
        {
          id: "R-001",
          title: "Auth approach",
          decision: "JWT",
          rationale: "Stateless",
          alternativesConsidered: ["Sessions"],
          codebasePrecedent: null,
        },
      ],
    };
    const result = ResearchFrontmatterSchema.parse(data);
    expect(result.decisions).toHaveLength(1);
    expect(result.version).toBe(1);
  });

  it("defaults decisions to empty array", () => {
    const result = ResearchFrontmatterSchema.parse({
      type: "research",
      specId: "SPEC-001",
    });
    expect(result.decisions).toEqual([]);
  });
});

describe("ResearchManager", () => {
  let root: string;
  let manager: ResearchManager;

  beforeEach(() => {
    root = createTempProject();
    manager = new ResearchManager(root);
  });

  it("creates a research template", () => {
    manager.createResearchTemplate("SPEC-001");
    const researchPath = join(root, ".primitiv", "specs", "SPEC-001-test", "research.md");
    const content = readFileSync(researchPath, "utf-8");
    expect(content).toContain("SPEC-001");
    expect(content).toContain("Research");
  });

  it("reads research from spec", () => {
    manager.createResearchTemplate("SPEC-001");
    const doc = manager.readResearch("SPEC-001");
    expect(doc).not.toBeNull();
    expect(doc!.data.specId).toBe("SPEC-001");
  });

  it("returns null for missing research", () => {
    const doc = manager.readResearch("SPEC-001");
    expect(doc).toBeNull();
  });

  it("validates empty research as invalid", () => {
    manager.createResearchTemplate("SPEC-001");
    const result = manager.validateResearch("SPEC-001");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("No research decisions found");
  });

  it("returns invalid for missing research file", () => {
    const result = manager.validateResearch("SPEC-001");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("research.md not found");
  });
});
