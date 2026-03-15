import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { PrimitivEngine } from "../src/engine/PrimitivEngine.js";
import { NotInitializedError } from "../src/utils/errors.js";
import { saveState } from "../src/utils/ids.js";
import { serializeDocument } from "../src/utils/frontmatter.js";

describe("PrimitivEngine", () => {
  let testDir: string;

  function initTestProject(): string {
    const dir = join(tmpdir(), `primitiv-engine-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(dir, ".primitiv", "gates"), { recursive: true });
    mkdirSync(join(dir, ".primitiv", "constitutions"), { recursive: true });
    mkdirSync(join(dir, ".primitiv", "specs"), { recursive: true });
    execSync("git init", { cwd: dir, stdio: "pipe" });
    execSync("git commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
    saveState(dir, {
      nextSpecId: 1,
      nextFeatureId: 1,
      projectRoot: dir,
      mode: "greenfield",
      initializedAt: new Date().toISOString(),
    });
    return dir;
  }

  beforeEach(() => {
    testDir = initTestProject();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("load", () => {
    it("loads engine for initialized git project", () => {
      const engine = PrimitivEngine.load(testDir);
      expect(engine).toBeDefined();
      expect(engine.projectRoot).toBe(testDir);
    });

    it("throws NotInitializedError for non-primitiv directory", () => {
      const plainDir = join(tmpdir(), `no-primitiv-${Date.now()}`);
      mkdirSync(plainDir, { recursive: true });
      execSync("git init", { cwd: plainDir, stdio: "pipe" });
      execSync("git commit --allow-empty -m 'init'", { cwd: plainDir, stdio: "pipe" });
      expect(() => PrimitivEngine.load(plainDir)).toThrow(NotInitializedError);
      rmSync(plainDir, { recursive: true, force: true });
    });
  });

  describe("createSpec", () => {
    it("creates a spec and returns frontmatter", () => {
      const engine = PrimitivEngine.load(testDir);
      const spec = engine.createSpec({ title: "Test Feature", description: "A test", author: "tester" });
      expect(spec.id).toBe("SPEC-001");
      expect(spec.status).toBe("draft");
    });

    it("creates spec with audit trail", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Audited Feature", description: "Track this", author: "tester" });
      const records = engine.audit.readAuditLog("SPEC-001");
      expect(records.length).toBe(1);
      expect(records[0].action).toBe("SPEC_CREATED");
    });
  });

  describe("getSpec", () => {
    it("retrieves created spec", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Get Me", description: "Retrieve this", author: "tester" });
      const doc = engine.getSpec("SPEC-001");
      expect(doc.data.title).toBe("Get Me");
    });
  });

  describe("listSpecs", () => {
    it("lists all specs", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "First", description: "A", author: "tester" });
      engine.createSpec({ title: "Second", description: "B", author: "tester" });
      const specs = engine.listSpecs();
      expect(specs).toHaveLength(2);
    });

    it("filters specs by status", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Draft", description: "Still draft", author: "tester" });
      const drafts = engine.listSpecs({ status: "draft" });
      expect(drafts).toHaveLength(1);
      const planned = engine.listSpecs({ status: "planned" });
      expect(planned).toHaveLength(0);
    });
  });

  describe("validateSpecGates", () => {
    it("returns alignment report for a spec", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Validate Me", description: "Check gates", author: "tester" });
      const report = engine.validateSpecGates("SPEC-001");
      expect(report.specId).toBe("SPEC-001");
      expect(report.gates).toHaveLength(5);
    });
  });

  describe("getSpecGraph", () => {
    it("returns graph with spec and null artifacts", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Graph Test", description: "Full graph", author: "tester" });
      const graph = engine.getSpecGraph("SPEC-001");
      expect(graph.spec.data.id).toBe("SPEC-001");
      expect(graph.plan).toBeNull();
      expect(graph.tasks).toBeNull();
      expect(graph.testResults).toBeNull();
    });
  });

  describe("facade wiring", () => {
    it("exposes all managers", () => {
      const engine = PrimitivEngine.load(testDir);
      expect(engine.gates).toBeDefined();
      expect(engine.constitutions).toBeDefined();
      expect(engine.specs).toBeDefined();
      expect(engine.features).toBeDefined();
      expect(engine.audit).toBeDefined();
      expect(engine.research).toBeDefined();
      expect(engine.contracts).toBeDefined();
    });
  });

  describe("getProjectContext", () => {
    it("returns context with specs list", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Context Test", description: "Check context", author: "tester" });
      const context = engine.getProjectContext();
      expect(Array.isArray(context.specs)).toBe(true);
      expect((context.specs as unknown[]).length).toBe(1);
    });
  });
});
