import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GovernanceCompiler, ensureGovernanceContext, COMPILER_VERSION } from "../src/engine/GovernanceCompiler.js";
import { GovernanceCompilationError } from "../src/utils/errors.js";
import { CompanyPrinciplesFrontmatterSchema } from "../src/schemas/gates.js";
import { ProductConstitutionFrontmatterSchema } from "../src/schemas/constitution.js";
import { writePrimitivFile } from "../src/utils/fileSystem.js";
import { serializeDocument } from "../src/utils/frontmatter.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const companyData = {
  type: "company-principles",
  version: 1,
  company: { name: "Primitiv", mission: "SDD", values: ["quality"] },
  policies: { compliance: [], legal: [], branding: [] },
  businessAlignment: { priorities: [], boundaries: [] },
  operatingPrinciples: ["Make Requirements Less Dumb"],
};

const securityData = {
  type: "security-principles",
  version: 1,
  policies: {
    authentication: ["OAuth2"],
    dataHandling: ["Encrypt at rest"],
    dependencies: [],
    networking: ["TLS"],
  },
  owaspAlignment: ["A01:2021"],
};

const productData = {
  type: "product-constitution",
  version: 1,
  product: { name: "Primitiv", domain: "dev-tools", targetUsers: ["devs"], valueProposition: "SDD" },
  modules: [{ name: "Spec Engine", description: "Core spec pipeline" }],
  lifecycleStates: ["draft", "deployed"],
  featureRegistry: [],
};

const devData = {
  type: "dev-constitution",
  version: 1,
  stack: { languages: ["TypeScript"], frameworks: [], databases: [], infrastructure: [] },
  conventions: { codeStyle: [], testing: [], documentation: [] },
  agentRules: ["SPEC IS TRUTH"],
};

const archData = {
  type: "arch-constitution",
  version: 1,
  patterns: { style: "modular-monolith" },
  boundaries: [],
  adrs: [],
};

function writeAllGovernanceFiles(testDir: string): void {
  writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(companyData, "# Company"));
  writePrimitivFile(testDir, ["gates", "security-principles.md"], serializeDocument(securityData, "# Security"));
  writePrimitivFile(testDir, ["constitutions", "product.md"], serializeDocument(productData, "# Product"));
  writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(devData, "# Dev"));
  writePrimitivFile(testDir, ["constitutions", "architecture.md"], serializeDocument(archData, "# Arch"));
}

// ─── Test setup ──────────────────────────────────────────────────────────────

describe("GovernanceCompiler", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `primitiv-gov-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(testDir, ".primitiv", "gates"), { recursive: true });
    mkdirSync(join(testDir, ".primitiv", "constitutions"), { recursive: true });
    mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  // ─── compile() ─────────────────────────────────────────────────────────────

  describe("compile()", () => {
    it("returns all sections non-null and no warnings when all 5 governance files are present", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      expect(ctx.company).not.toBeNull();
      expect(ctx.security).not.toBeNull();
      expect(ctx.product).not.toBeNull();
      expect(ctx.development).not.toBeNull();
      expect(ctx.architecture).not.toBeNull();
      expect(ctx.warnings).toHaveLength(0);
    });

    it("returns security: null and one warning when security file is missing", () => {
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(companyData, "# Company"));
      writePrimitivFile(testDir, ["constitutions", "product.md"], serializeDocument(productData, "# Product"));
      writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(devData, "# Dev"));
      writePrimitivFile(testDir, ["constitutions", "architecture.md"], serializeDocument(archData, "# Arch"));

      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      expect(ctx.security).toBeNull();
      expect(ctx.company).not.toBeNull();
      expect(ctx.warnings).toHaveLength(1);
      expect(ctx.warnings[0].message).toContain("security");
    });

    it("returns all 5 sections null and 5 warnings when no governance files exist", () => {
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      expect(ctx.company).toBeNull();
      expect(ctx.security).toBeNull();
      expect(ctx.product).toBeNull();
      expect(ctx.development).toBeNull();
      expect(ctx.architecture).toBeNull();
      expect(ctx.warnings).toHaveLength(5);
    });

    it("throws GovernanceCompilationError on malformed YAML frontmatter, with file name in message", () => {
      // Write a file with valid frontmatter structure but invalid Zod type (missing required 'company.name')
      const malformedContent = "---\ntype: company-principles\nversion: 1\ncompany: {}\n---\n# Company\n";
      writePrimitivFile(testDir, ["gates", "company-principles.md"], malformedContent);

      const compiler = new GovernanceCompiler(testDir);
      expect(() => compiler.compile()).toThrow(GovernanceCompilationError);

      try {
        compiler.compile();
      } catch (err) {
        expect(err).toBeInstanceOf(GovernanceCompilationError);
        expect((err as Error).message).toContain("company-principles.md");
      }
    });

    it("sourceHash is identical across two consecutive compile() calls on unchanged files", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);

      const ctx1 = compiler.compile();
      const ctx2 = compiler.compile();

      expect(ctx1.sourceHash).toBe(ctx2.sourceHash);
    });

    it("sets version to COMPILER_VERSION", () => {
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();
      expect(ctx.version).toBe(COMPILER_VERSION);
    });
  });

  // ─── constraints derivation ────────────────────────────────────────────────

  describe("constraints derivation", () => {
    it("COMPILER_VERSION is '1.1'", () => {
      expect(COMPILER_VERSION).toBe("1.1");
    });

    it("isStale() returns true for a cached context with version '1.0'", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const staleCtx = { ...compiler.compile(), version: "1.0" };
      expect(compiler.isStale(staleCtx)).toBe(true);
    });

    it("populates all four categories from full governance", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      expect(ctx.constraints.tech.map(c => c.rule)).toContain("TypeScript");
      expect(ctx.constraints.tech.every(c => c.category === "tech")).toBe(true);

      expect(ctx.constraints.code.map(c => c.rule)).toContain("SPEC IS TRUTH");
      expect(ctx.constraints.code.every(c => c.category === "code")).toBe(true);

      expect(ctx.constraints.architecture.map(c => c.rule)).toContain("modular-monolith");
      expect(ctx.constraints.architecture.every(c => c.category === "architecture")).toBe(true);

      const securityRules = ctx.constraints.security.map(c => c.rule);
      expect(securityRules).toContain("OAuth2");
      expect(securityRules).toContain("Encrypt at rest");
      expect(securityRules).toContain("TLS");
      expect(securityRules).toContain("A01:2021");
      expect(ctx.constraints.security.every(c => c.category === "security")).toBe(true);
    });

    it("constraints.security is [] when security governance file is absent", () => {
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(companyData, "# Company"));
      writePrimitivFile(testDir, ["constitutions", "product.md"], serializeDocument(productData, "# Product"));
      writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(devData, "# Dev"));
      writePrimitivFile(testDir, ["constitutions", "architecture.md"], serializeDocument(archData, "# Arch"));

      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      expect(ctx.constraints.security).toEqual([]);
      expect(ctx.constraints.tech.length).toBeGreaterThan(0);
    });

    it("all four categories are empty arrays when no governance files exist", () => {
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      expect(ctx.constraints.tech).toEqual([]);
      expect(ctx.constraints.code).toEqual([]);
      expect(ctx.constraints.architecture).toEqual([]);
      expect(ctx.constraints.security).toEqual([]);
    });

    it("deduplicates rules that appear in multiple sources within a category", () => {
      const devWithDup = {
        ...devData,
        agentRules: ["SPEC IS TRUTH", "Use TypeScript"],
        conventions: { ...devData.conventions, codeStyle: ["SPEC IS TRUTH"] },
      };
      writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(devWithDup, "# Dev"));

      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      const codeRules = ctx.constraints.code.map(c => c.rule);
      const dupCount = codeRules.filter(r => r === "SPEC IS TRUTH").length;
      expect(dupCount).toBe(1);
    });

    it("constraints are sorted alphabetically by rule within each category", () => {
      const devWithMultiple = {
        ...devData,
        stack: { languages: ["TypeScript", "Go"], frameworks: ["Express"], databases: [], infrastructure: [] },
        agentRules: ["Use zod", "Always test", "SPEC IS TRUTH"],
      };
      writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(devWithMultiple, "# Dev"));

      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      const techRules = ctx.constraints.tech.map(c => c.rule);
      expect(techRules).toEqual([...techRules].sort((a, b) => a.localeCompare(b)));

      const codeRules = ctx.constraints.code.map(c => c.rule);
      expect(codeRules).toEqual([...codeRules].sort((a, b) => a.localeCompare(b)));
    });

    it("constraint source field reflects the governance section it was derived from", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      const tsConstraint = ctx.constraints.tech.find(c => c.rule === "TypeScript");
      expect(tsConstraint?.source).toBe("development.stack");

      const agentRuleConstraint = ctx.constraints.code.find(c => c.rule === "SPEC IS TRUTH");
      expect(agentRuleConstraint?.source).toBe("development.agentRules");

      const archConstraint = ctx.constraints.architecture.find(c => c.rule === "modular-monolith");
      expect(archConstraint?.source).toBe("architecture.patterns.style");

      const secConstraint = ctx.constraints.security.find(c => c.rule === "OAuth2");
      expect(secConstraint?.source).toBe("security.policies.authentication");
    });
  });

  // ─── isStale() ─────────────────────────────────────────────────────────────

  describe("isStale()", () => {
    it("returns true when cached.version differs from COMPILER_VERSION", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const staleCtx = { ...compiler.compile(), version: "0.0" };
      expect(compiler.isStale(staleCtx)).toBe(true);
    });

    it("returns true when a governance file is modified after caching", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();

      // Modify a file
      const modified = { ...companyData, company: { ...companyData.company, name: "Changed" } };
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(modified, "# Company"));

      expect(compiler.isStale(ctx)).toBe(true);
    });

    it("returns false when version matches and no files have changed", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();
      expect(compiler.isStale(ctx)).toBe(false);
    });
  });

  // ─── write() and readCached() ──────────────────────────────────────────────

  describe("write() and readCached()", () => {
    it("write() followed by readCached() returns a valid GovernanceContext", () => {
      writeAllGovernanceFiles(testDir);
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();
      compiler.write(ctx);

      const cached = compiler.readCached();
      expect(cached).not.toBeNull();
      expect(cached?.version).toBe(COMPILER_VERSION);
      expect(cached?.sourceHash).toBe(ctx.sourceHash);
    });

    it("readCached() returns null when governance-context.json does not exist", () => {
      const compiler = new GovernanceCompiler(testDir);
      expect(compiler.readCached()).toBeNull();
    });

    it("write() creates .primitiv/.gitignore containing 'governance-context.json'", () => {
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();
      compiler.write(ctx);

      const gitignorePath = join(testDir, ".primitiv", ".gitignore");
      expect(existsSync(gitignorePath)).toBe(true);
      expect(readFileSync(gitignorePath, "utf-8")).toContain("governance-context.json");
    });

    it("calling write() twice does not produce a duplicate entry in .gitignore", () => {
      const compiler = new GovernanceCompiler(testDir);
      const ctx = compiler.compile();
      compiler.write(ctx);
      compiler.write(ctx);

      const gitignorePath = join(testDir, ".primitiv", ".gitignore");
      const content = readFileSync(gitignorePath, "utf-8");
      const occurrences = content.split("\n").filter(l => l.trim() === "governance-context.json").length;
      expect(occurrences).toBe(1);
    });
  });

  // ─── ensureGovernanceContext() ─────────────────────────────────────────────

  describe("ensureGovernanceContext()", () => {
    it("compiles fresh and returns recompiled: false when no cache exists", () => {
      writeAllGovernanceFiles(testDir);
      const result = ensureGovernanceContext(testDir);

      expect(result.context).toBeDefined();
      expect(result.recompiled).toBe(false);
      expect(result.notices).toHaveLength(0);
    });

    it("returns recompiled: true with a notice when cache is stale", () => {
      writeAllGovernanceFiles(testDir);

      // Write a stale cache (wrong version)
      const compiler = new GovernanceCompiler(testDir);
      const stale = { ...compiler.compile(), version: "0.0" };
      compiler.write(stale);

      const result = ensureGovernanceContext(testDir);
      expect(result.recompiled).toBe(true);
      expect(result.notices.length).toBeGreaterThan(0);
      expect(result.notices[0]).toContain("⟳");
    });

    it("returns cached context with recompiled: false and no notices when cache is fresh", () => {
      writeAllGovernanceFiles(testDir);

      // First call populates cache
      ensureGovernanceContext(testDir);

      // Second call should hit the cache
      const result = ensureGovernanceContext(testDir);
      expect(result.recompiled).toBe(false);
      expect(result.notices).toHaveLength(0);
    });
  });
});

// ─── Schema gap tests ─────────────────────────────────────────────────────────

describe("Schema gap fixes", () => {
  it("CompanyPrinciplesFrontmatterSchema parses operatingPrinciples correctly", () => {
    const data = {
      type: "company-principles",
      version: 1,
      company: { name: "Primitiv" },
      policies: { compliance: [], legal: [], branding: [] },
      businessAlignment: { priorities: [], boundaries: [] },
      operatingPrinciples: ["Make Requirements Less Dumb", "Disagree and Commit"],
    };
    const result = CompanyPrinciplesFrontmatterSchema.parse(data);
    expect(result.operatingPrinciples).toEqual(["Make Requirements Less Dumb", "Disagree and Commit"]);
  });

  it("CompanyPrinciplesFrontmatterSchema defaults operatingPrinciples to [] when absent", () => {
    const data = {
      type: "company-principles",
      company: { name: "Primitiv" },
    };
    const result = CompanyPrinciplesFrontmatterSchema.parse(data);
    expect(result.operatingPrinciples).toEqual([]);
  });

  it("ProductConstitutionFrontmatterSchema parses modules correctly", () => {
    const data = {
      type: "product-constitution",
      product: { name: "Primitiv" },
      modules: [
        { name: "Spec Engine", description: "Core spec pipeline" },
        { name: "Build Orchestration" },
      ],
    };
    const result = ProductConstitutionFrontmatterSchema.parse(data);
    expect(result.modules).toHaveLength(2);
    expect(result.modules[0].name).toBe("Spec Engine");
    expect(result.modules[0].description).toBe("Core spec pipeline");
    expect(result.modules[1].description).toBeUndefined();
  });

  it("ProductConstitutionFrontmatterSchema parses lifecycleStates correctly", () => {
    const data = {
      type: "product-constitution",
      product: { name: "Primitiv" },
      lifecycleStates: ["draft", "in_development", "deployed"],
    };
    const result = ProductConstitutionFrontmatterSchema.parse(data);
    expect(result.lifecycleStates).toEqual(["draft", "in_development", "deployed"]);
  });

  it("ProductConstitutionFrontmatterSchema defaults modules and lifecycleStates to [] when absent", () => {
    const data = {
      type: "product-constitution",
      product: { name: "Primitiv" },
    };
    const result = ProductConstitutionFrontmatterSchema.parse(data);
    expect(result.modules).toEqual([]);
    expect(result.lifecycleStates).toEqual([]);
  });
});
