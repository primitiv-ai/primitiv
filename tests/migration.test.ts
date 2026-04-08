import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { MigrationManager } from "../src/engine/MigrationManager.js";
import { MigrationNotFoundError } from "../src/utils/errors.js";
import { loadState, saveState } from "../src/utils/ids.js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("MigrationManager", () => {
  let testDir: string;

  function createTestDir(): string {
    const dir = join(tmpdir(), `primitiv-migrate-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    execSync("git init", { cwd: dir, stdio: "pipe" });
    execSync("git commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
    return dir;
  }

  function createSpecKitProject(dir: string, options?: {
    constitution?: string;
    claudeMd?: string;
    specs?: Array<{ name: string; files?: Record<string, string> }>;
  }): void {
    // .specify/memory/constitution.md
    mkdirSync(join(dir, ".specify", "memory"), { recursive: true });
    if (options?.constitution) {
      writeFileSync(join(dir, ".specify", "memory", "constitution.md"), options.constitution);
    }

    // CLAUDE.md
    if (options?.claudeMd) {
      writeFileSync(join(dir, "CLAUDE.md"), options.claudeMd);
    }

    // specs/
    if (options?.specs) {
      mkdirSync(join(dir, "specs"), { recursive: true });
      for (const spec of options.specs) {
        const specDir = join(dir, "specs", spec.name);
        mkdirSync(specDir, { recursive: true });
        if (spec.files) {
          for (const [fileName, content] of Object.entries(spec.files)) {
            const filePath = join(specDir, fileName);
            const fileDir = filePath.substring(0, filePath.lastIndexOf("/"));
            if (!existsSync(fileDir)) {
              mkdirSync(fileDir, { recursive: true });
            }
            writeFileSync(filePath, content);
          }
        }
      }
    }
  }

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  // ── Detection ────────────────────────────────────────────────────────────

  describe("detectSpecKit", () => {
    it("returns found=true when .specify/ and specs/ exist", () => {
      createSpecKitProject(testDir, { specs: [{ name: "001-test", files: { "spec.md": "# Test" } }] });
      const manager = new MigrationManager(testDir);
      const result = manager.detectSpecKit();
      expect(result.found).toBe(true);
      expect(result.specifyDir).toBeDefined();
      expect(result.specsDir).toBeDefined();
    });

    it("returns found=false when neither .specify/ nor specs/ exist", () => {
      const manager = new MigrationManager(testDir);
      const result = manager.detectSpecKit();
      expect(result.found).toBe(false);
      expect(result.specifyDir).toBeUndefined();
      expect(result.specsDir).toBeUndefined();
    });

    it("returns found=true with only specs/ directory", () => {
      mkdirSync(join(testDir, "specs"), { recursive: true });
      const manager = new MigrationManager(testDir);
      const result = manager.detectSpecKit();
      expect(result.found).toBe(true);
      expect(result.specifyDir).toBeUndefined();
      expect(result.specsDir).toBeDefined();
    });

    it("detects CLAUDE.md when present", () => {
      createSpecKitProject(testDir, { claudeMd: "# Architecture", specs: [] });
      const manager = new MigrationManager(testDir);
      const result = manager.detectSpecKit();
      expect(result.claudeMdPath).toBeDefined();
    });

    it("returns claudeMdPath=undefined when no CLAUDE.md", () => {
      createSpecKitProject(testDir, { specs: [] });
      const manager = new MigrationManager(testDir);
      const result = manager.detectSpecKit();
      expect(result.claudeMdPath).toBeUndefined();
    });
  });

  // ── Spec Discovery ───────────────────────────────────────────────────────

  describe("discoverSpecKitSpecs", () => {
    it("returns sorted directory names by numeric prefix", () => {
      createSpecKitProject(testDir, {
        specs: [
          { name: "140-person-doc", files: { "spec.md": "# A" } },
          { name: "133-fix-upload", files: { "spec.md": "# B" } },
          { name: "135-dashboard", files: { "spec.md": "# C" } },
        ],
      });
      const manager = new MigrationManager(testDir);
      const dirs = manager.discoverSpecKitSpecs(join(testDir, "specs"));
      expect(dirs).toEqual(["133-fix-upload", "135-dashboard", "140-person-doc"]);
    });

    it("ignores non-matching directories", () => {
      createSpecKitProject(testDir, {
        specs: [
          { name: "001-valid", files: { "spec.md": "# A" } },
          { name: "not-a-spec", files: { "spec.md": "# B" } },
        ],
      });
      // Create a non-matching dir manually
      mkdirSync(join(testDir, "specs", "readme-files"), { recursive: true });
      const manager = new MigrationManager(testDir);
      const dirs = manager.discoverSpecKitSpecs(join(testDir, "specs"));
      expect(dirs).toEqual(["001-valid"]);
    });
  });

  describe("buildSpecMapping", () => {
    it("creates sequential SPEC-001, SPEC-002 IDs", () => {
      const manager = new MigrationManager(testDir);
      const mappings = manager.buildSpecMapping(["133-fix-upload", "135-dashboard", "140-person-doc"]);
      expect(mappings).toHaveLength(3);
      expect(mappings[0].primitivId).toBe("SPEC-001");
      expect(mappings[0].original).toBe("133-fix-upload");
      expect(mappings[0].slug).toBe("fix-upload");
      expect(mappings[0].primitivDir).toBe("SPEC-001-fix-upload");
      expect(mappings[1].primitivId).toBe("SPEC-002");
      expect(mappings[2].primitivId).toBe("SPEC-003");
    });
  });

  // ── Constitution Splitting ───────────────────────────────────────────────

  describe("splitConstitution", () => {
    it("splits on H2 headers correctly", () => {
      const content = [
        "# My Constitution",
        "",
        "## Product Principles",
        "",
        "### I. Case Primacy",
        "Cases are important.",
        "",
        "## Development Principles",
        "",
        "### VIII. Spec as Source",
        "Specs are truth.",
        "",
        "## Principle Interlock",
        "",
        "Product and dev are linked.",
      ].join("\n");

      const manager = new MigrationManager(testDir);
      const result = manager.splitConstitution(content);

      expect(result.strategy).toBe("h2-match");
      expect(result.product).toContain("Case Primacy");
      expect(result.product).toContain("Principle Interlock");
      expect(result.product).not.toContain("Spec as Source");
      expect(result.development).toContain("Spec as Source");
      expect(result.development).not.toContain("Case Primacy");
    });

    it("falls back to keyword match when no H2 headers", () => {
      const content = [
        "# Constitution",
        "",
        "### Product Rules",
        "Rule 1.",
        "",
        "### Development Rules",
        "Rule 2.",
      ].join("\n");

      const manager = new MigrationManager(testDir);
      const result = manager.splitConstitution(content);

      expect(result.strategy).toBe("keyword-match");
      expect(result.product).toContain("Product Rules");
      expect(result.development).toContain("Development Rules");
    });

    it("returns null development when no dev section found", () => {
      const content = [
        "# Constitution",
        "",
        "## Product Principles",
        "",
        "All the rules.",
      ].join("\n");

      const manager = new MigrationManager(testDir);
      const result = manager.splitConstitution(content);

      expect(result.development).toBeNull();
      expect(result.product).toContain("All the rules");
    });

    it("uses fallback when no recognizable sections", () => {
      const content = "Just some text without any headings matching product or development.";

      const manager = new MigrationManager(testDir);
      const result = manager.splitConstitution(content);

      expect(result.strategy).toBe("fallback");
      expect(result.product).toBe(content);
      expect(result.development).toBeNull();
    });
  });

  // ── Architecture Migration ───────────────────────────────────────────────

  describe("reReferenceTechtackEntries", () => {
    it("replaces (NNN-slug) with (SPEC-XXX)", () => {
      const content = [
        "- TypeScript 5.7+ (133-fix-upload)",
        "- PostgreSQL via Prisma (135-dashboard)",
        "Some other text",
      ].join("\n");

      const mappings = [
        { original: "133-fix-upload", primitivId: "SPEC-001", slug: "fix-upload", primitivDir: "SPEC-001-fix-upload" },
        { original: "135-dashboard", primitivId: "SPEC-002", slug: "dashboard", primitivDir: "SPEC-002-dashboard" },
      ];

      const manager = new MigrationManager(testDir);
      const result = manager.reReferenceTechtackEntries(content, mappings);

      expect(result).toContain("(SPEC-001)");
      expect(result).toContain("(SPEC-002)");
      expect(result).not.toContain("(133-fix-upload)");
      expect(result).toContain("Some other text");
    });

    it("preserves unmatched entries", () => {
      const content = "- Something (999-unknown-spec)\n- Plain text";
      const manager = new MigrationManager(testDir);
      const result = manager.reReferenceTechtackEntries(content, []);

      expect(result).toContain("(999-unknown-spec)");
      expect(result).toContain("Plain text");
    });

    it("handles content with no tech stack entries", () => {
      const content = "# Architecture\n\nNo tech stack entries here.";
      const manager = new MigrationManager(testDir);
      const result = manager.reReferenceTechtackEntries(content, []);
      expect(result).toBe(content);
    });
  });

  // ── Spec Migration ───────────────────────────────────────────────────────

  describe("migrateSpec", () => {
    it("creates correct directory structure and frontmatter", () => {
      const specContent = matter.stringify("# Fix Upload\n\nDescription here.", {
        title: "Fix Package Upload State",
        status: "complete",
        author: "Developer",
        createdAt: "2026-01-15T10:00:00Z",
      });

      createSpecKitProject(testDir, {
        specs: [{ name: "133-fix-upload", files: { "spec.md": specContent } }],
      });

      // Initialize .primitiv
      mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });

      const manager = new MigrationManager(testDir);
      const mapping = {
        original: "133-fix-upload",
        primitivId: "SPEC-001",
        slug: "fix-upload",
        primitivDir: "SPEC-001-fix-upload",
      };

      const result = manager.migrateSpec(join(testDir, "specs"), mapping);

      expect(result.migrated).toBe(true);
      expect(result.artifacts).toContain("spec.md");

      // Verify the migrated spec
      const migratedPath = join(testDir, ".primitiv", "specs", "SPEC-001-fix-upload", "spec.md");
      expect(existsSync(migratedPath)).toBe(true);

      const { data } = matter(readFileSync(migratedPath, "utf-8"));
      expect(data.type).toBe("spec");
      expect(data.id).toBe("SPEC-001");
      expect(data.title).toBe("Fix Package Upload State");
      expect(data.status).toBe("completed");
      expect(data.branch).toBe("spec/SPEC-001-fix-upload");
    });

    it("copies all artifact types", () => {
      createSpecKitProject(testDir, {
        specs: [{
          name: "001-full-spec",
          files: {
            "spec.md": "---\ntitle: Full\n---\n# Full",
            "plan.md": "---\ntitle: Plan\n---\n# Plan",
            "tasks.md": "---\ntitle: Tasks\n---\n# Tasks",
            "research.md": "# Research notes",
            "data-model.md": "# Data Model",
            "quickstart.md": "# Quickstart",
            "contracts/api-contracts.md": "# API Contract",
            "checklists/requirements.md": "# Requirements",
          },
        }],
      });

      mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });

      const manager = new MigrationManager(testDir);
      const mapping = {
        original: "001-full-spec",
        primitivId: "SPEC-001",
        slug: "full-spec",
        primitivDir: "SPEC-001-full-spec",
      };

      const result = manager.migrateSpec(join(testDir, "specs"), mapping);

      expect(result.migrated).toBe(true);
      expect(result.artifacts).toContain("spec.md");
      expect(result.artifacts).toContain("plan.md");
      expect(result.artifacts).toContain("tasks.md");
      expect(result.artifacts).toContain("research.md");
      expect(result.artifacts).toContain("quickstart.md");
      expect(result.artifacts).toContain("data-model/data-model.md");
      expect(result.artifacts).toContain("contracts/api-contracts.md");
      expect(result.artifacts).toContain("checklists/requirements.md");

      // Verify data-model is in subdirectory
      const dataModelPath = join(testDir, ".primitiv", "specs", "SPEC-001-full-spec", "data-model", "data-model.md");
      expect(existsSync(dataModelPath)).toBe(true);
    });

    it("skips missing optional artifacts without error", () => {
      createSpecKitProject(testDir, {
        specs: [{ name: "001-minimal", files: { "spec.md": "---\ntitle: Min\n---\n# Min" } }],
      });

      mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });

      const manager = new MigrationManager(testDir);
      const mapping = {
        original: "001-minimal",
        primitivId: "SPEC-001",
        slug: "minimal",
        primitivDir: "SPEC-001-minimal",
      };

      const result = manager.migrateSpec(join(testDir, "specs"), mapping);
      expect(result.migrated).toBe(true);
      expect(result.artifacts).toEqual(["spec.md"]);
    });
  });

  // ── Merge Strategy ───────────────────────────────────────────────────────

  describe("merge strategy", () => {
    it("skips existing constitution files", () => {
      createSpecKitProject(testDir, {
        constitution: "## Product Principles\n\nOriginal product rules.\n\n## Development Principles\n\nOriginal dev rules.",
        specs: [],
      });

      // Pre-create .primitiv with existing constitution
      mkdirSync(join(testDir, ".primitiv", "constitutions"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "gates"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });
      writeFileSync(join(testDir, ".primitiv", "constitutions", "product.md"), "# Existing product");
      saveState(testDir, {
        nextSpecId: 1,
        nextFeatureId: 1,

        mode: "greenfield",
        initializedAt: new Date().toISOString(),
      });

      const manager = new MigrationManager(testDir);
      const result = manager.migrateConstitution();

      expect(result.skipped).toContain("product");
      expect(result.migrated).toContain("development");

      // Verify original product.md was not overwritten
      const productContent = readFileSync(join(testDir, ".primitiv", "constitutions", "product.md"), "utf-8");
      expect(productContent).toBe("# Existing product");
    });

    it("skips already-migrated specs", () => {
      createSpecKitProject(testDir, {
        specs: [{ name: "001-test", files: { "spec.md": "---\ntitle: Test\n---\n# Test" } }],
      });

      // Pre-create migrated spec
      mkdirSync(join(testDir, ".primitiv", "specs", "SPEC-001-test"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "gates"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "constitutions"), { recursive: true });
      writeFileSync(join(testDir, ".primitiv", "specs", "SPEC-001-test", "spec.md"), "# Already migrated");
      saveState(testDir, {
        nextSpecId: 1,
        nextFeatureId: 1,

        mode: "greenfield",
        initializedAt: new Date().toISOString(),
      });

      const manager = new MigrationManager(testDir);
      const mapping = {
        original: "001-test",
        primitivId: "SPEC-001",
        slug: "test",
        primitivDir: "SPEC-001-test",
      };

      const result = manager.migrateSpec(join(testDir, "specs"), mapping);
      expect(result.migrated).toBe(false);
    });
  });

  // ── Full Migration ───────────────────────────────────────────────────────

  describe("migrate", () => {
    it("performs end-to-end migration on a mock SpecKit project", () => {
      createSpecKitProject(testDir, {
        constitution: "## Product Principles\n\nProduct rules.\n\n## Development Principles\n\nDev rules.",
        claudeMd: "# Architecture\n\n- TypeScript 5.7+ (001-feature-a)\n- PostgreSQL (002-feature-b)",
        specs: [
          { name: "001-feature-a", files: { "spec.md": "---\ntitle: Feature A\n---\n# Feature A" } },
          { name: "002-feature-b", files: {
            "spec.md": "---\ntitle: Feature B\nauthor: Dev\n---\n# Feature B",
            "plan.md": "---\ntitle: Plan B\n---\n# Plan B",
          }},
        ],
      });

      const manager = new MigrationManager(testDir);
      const report = manager.migrate();

      expect(report.specsMigrated).toHaveLength(2);
      expect(report.specsMigrated[0].primitivId).toBe("SPEC-001");
      expect(report.specsMigrated[1].primitivId).toBe("SPEC-002");
      expect(report.constitutionsMigrated).toContain("product");
      expect(report.constitutionsMigrated).toContain("development");
      expect(report.architectureMigrated).toBe(true);

      // Verify architecture has re-referenced entries
      const archContent = readFileSync(join(testDir, ".primitiv", "constitutions", "architecture.md"), "utf-8");
      expect(archContent).toContain("(SPEC-001)");
      expect(archContent).toContain("(SPEC-002)");
      expect(archContent).not.toContain("(001-feature-a)");

      // Verify state
      const state = loadState(testDir);
      expect(state.mode).toBe("brownfield");
      expect(state.nextSpecId).toBe(3);
    });

    it("throws MigrationNotFoundError when no SpecKit detected", () => {
      const manager = new MigrationManager(testDir);
      expect(() => manager.migrate()).toThrow(MigrationNotFoundError);
    });

    it("is idempotent — running twice produces same result", () => {
      createSpecKitProject(testDir, {
        constitution: "## Product Principles\n\nRules.",
        specs: [
          { name: "001-test", files: { "spec.md": "---\ntitle: Test\n---\n# Test" } },
        ],
      });

      const manager = new MigrationManager(testDir);

      // First run
      const report1 = manager.migrate();
      expect(report1.specsMigrated).toHaveLength(1);

      // Second run
      const report2 = manager.migrate();
      expect(report2.specsMigrated).toHaveLength(0);
      expect(report2.specsSkipped).toHaveLength(1);
      expect(report2.constitutionsSkipped).toContain("product");
    });
  });

  // ── State ────────────────────────────────────────────────────────────────

  describe("updateState", () => {
    it("sets brownfield mode and correct nextSpecId", () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      saveState(testDir, {
        nextSpecId: 1,
        nextFeatureId: 5,

        mode: "greenfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      const manager = new MigrationManager(testDir);
      manager.updateState(8);

      const state = loadState(testDir);
      expect(state.mode).toBe("brownfield");
      expect(state.nextSpecId).toBe(9);
      expect(state.nextFeatureId).toBe(5); // Preserved
      expect(state.initializedAt).toBe("2026-01-01T00:00:00Z"); // Preserved
    });

    it("preserves higher existing nextSpecId", () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      saveState(testDir, {
        nextSpecId: 20,
        nextFeatureId: 1,

        mode: "greenfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      const manager = new MigrationManager(testDir);
      manager.updateState(5);

      const state = loadState(testDir);
      expect(state.nextSpecId).toBe(20); // Kept the higher value
    });
  });

  // ── Acceptance Criteria: Additional Coverage ─────────────────────────────

  describe("acceptance criteria coverage", () => {
    it("shared governance sections are preserved in product.md", () => {
      const content = [
        "# Constitution",
        "",
        "## Product Principles",
        "",
        "### I. Case Primacy",
        "Cases are important.",
        "",
        "## Development Principles",
        "",
        "### VIII. Spec as Source",
        "Specs are truth.",
        "",
        "## Principle Interlock",
        "",
        "| Product | Dev |",
        "|---------|-----|",
        "| I       | VIII|",
        "",
        "## Unacceptable Risks",
        "",
        "Silent failures are bad.",
      ].join("\n");

      const manager = new MigrationManager(testDir);
      const result = manager.splitConstitution(content);

      expect(result.product).toContain("Principle Interlock");
      expect(result.product).toContain("Unacceptable Risks");
      expect(result.product).toContain("Silent failures are bad");
      expect(result.development).not.toBeNull();
      expect(result.development).not.toContain("Principle Interlock");
    });

    it("gates directory is created during migration", () => {
      createSpecKitProject(testDir, {
        specs: [{ name: "001-test", files: { "spec.md": "---\ntitle: T\n---\n# T" } }],
      });

      const manager = new MigrationManager(testDir);
      manager.migrate();

      expect(existsSync(join(testDir, ".primitiv", "gates"))).toBe(true);
    });

    it("migration report contains correct structure", () => {
      createSpecKitProject(testDir, {
        constitution: "## Product Principles\n\nRules.\n\n## Development Principles\n\nDev rules.",
        claudeMd: "# Arch\n\n- TypeScript (001-test)",
        specs: [
          { name: "001-test", files: { "spec.md": "---\ntitle: Test\n---\n# Test" } },
          { name: "002-other", files: { "spec.md": "---\ntitle: Other\n---\n# Other" } },
        ],
      });

      const manager = new MigrationManager(testDir);
      const report = manager.migrate();

      // Report structure
      expect(report.specsMigrated).toHaveLength(2);
      expect(report.constitutionsMigrated).toContain("product");
      expect(report.constitutionsMigrated).toContain("development");
      expect(report.architectureMigrated).toBe(true);
      expect(report.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining("company-principles"),
          expect.stringContaining("security-principles"),
        ])
      );
      // Mapping table data
      expect(report.specsMigrated[0].primitivId).toBe("SPEC-001");
      expect(report.specsMigrated[0].original).toBe("001-test");
      expect(report.specsMigrated[1].primitivId).toBe("SPEC-002");
    });

    it("original SpecKit files are preserved after migration", () => {
      const specContent = "---\ntitle: Original\n---\n# Original spec";
      createSpecKitProject(testDir, {
        constitution: "## Product Principles\n\nRules.",
        claudeMd: "# Arch",
        specs: [{ name: "001-test", files: { "spec.md": specContent } }],
      });

      const manager = new MigrationManager(testDir);
      manager.migrate();

      // Verify original files still exist and are unchanged
      expect(existsSync(join(testDir, ".specify", "memory", "constitution.md"))).toBe(true);
      expect(existsSync(join(testDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(join(testDir, "specs", "001-test", "spec.md"))).toBe(true);
      expect(readFileSync(join(testDir, "specs", "001-test", "spec.md"), "utf-8")).toBe(specContent);
    });

    it("CLI migrate command is registered", async () => {
      const { createCli } = await import("../src/cli.js");
      const cli = createCli();
      const migrateCmd = cli.commands.find((c: { name: () => string }) => c.name() === "migrate");
      expect(migrateCmd).toBeDefined();
      const speckitCmd = migrateCmd!.commands.find((c: { name: () => string }) => c.name() === "speckit");
      expect(speckitCmd).toBeDefined();
    });

    it("primitiv.migrate.md slash command template is listed", async () => {
      const { getCommandTemplateNames } = await import("../src/init/templates.js");
      expect(getCommandTemplateNames()).toContain("primitiv.migrate.md");
    });

    it("primitiv.implement.md contains tech stack append step", () => {
      const implementPath = join(__dirname, "..", ".claude", "commands", "primitiv.implement.md");
      const content = readFileSync(implementPath, "utf-8");
      expect(content).toContain("architecture log");
      expect(content).toContain("constitutions/architecture.md");
    });
  });
});
