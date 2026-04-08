import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { saveState } from "../src/utils/ids.js";
import { PrimitivEngine } from "../src/engine/PrimitivEngine.js";
import { SPEC_STATUSES } from "../src/schemas/common.js";

describe("Status command logic", () => {
  let testDir: string;

  function initTestProject(): string {
    const dir = join(tmpdir(), `primitiv-status-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(dir, ".primitiv", "gates"), { recursive: true });
    mkdirSync(join(dir, ".primitiv", "constitutions"), { recursive: true });
    mkdirSync(join(dir, ".primitiv", "specs"), { recursive: true });
    execSync("git init", { cwd: dir, stdio: "pipe" });
    execSync("git commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
    saveState(dir, {
      nextSpecId: 1,
      nextFeatureId: 1,

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

  describe("listSpecs (underlying status data)", () => {
    it("returns all specs when no filter", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Feature A", description: "A", author: "tester" });
      engine.createSpec({ title: "Feature B", description: "B", author: "tester" });
      engine.createSpec({ title: "Feature C", description: "C", author: "tester" });
      const specs = engine.listSpecs();
      expect(specs).toHaveLength(3);
    });

    it("each spec shows ID, title, status, branch", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "User Auth", description: "Auth", author: "tester" });
      const specs = engine.listSpecs();
      const spec = specs[0];
      expect(spec.data.id).toBe("SPEC-001");
      expect(spec.data.title).toBe("User Auth");
      expect(spec.data.status).toBe("draft");
      expect(spec.data.branch).toBe("spec/SPEC-001-user-auth");
    });

    it("filters by status draft", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "A", description: "A", author: "tester" });
      engine.createSpec({ title: "B", description: "B", author: "tester" });
      const drafts = engine.listSpecs({ status: "draft" });
      expect(drafts).toHaveLength(2);
      const completed = engine.listSpecs({ status: "completed" });
      expect(completed).toHaveLength(0);
    });
  });

  describe("spec detail view (getSpecGraph)", () => {
    it("returns spec with plan/tasks/test status indicators", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Detailed Spec", description: "Details", author: "tester" });
      const graph = engine.getSpecGraph("SPEC-001");
      expect(graph.spec.data.id).toBe("SPEC-001");
      expect(graph.spec.data.title).toBe("Detailed Spec");
      expect(graph.plan).toBeNull();
      expect(graph.tasks).toBeNull();
      expect(graph.testResults).toBeNull();
      expect(graph.clarifications).toBeNull();
    });
  });

  describe("SPEC_STATUSES validation", () => {
    it("includes all expected status values", () => {
      const expected = [
        "draft", "gate-1-passed", "gate-2-passed", "gate-3-passed",
        "clarified", "planned", "tasked", "in-progress", "tested", "completed",
      ];
      expect(SPEC_STATUSES).toEqual(expected);
    });
  });

  describe("markdown report generation", () => {
    it("can generate markdown table from spec data", () => {
      const engine = PrimitivEngine.load(testDir);
      engine.createSpec({ title: "Report Feature", description: "For report", author: "Dieu" });
      engine.createSpec({ title: "Another Feature", description: "Also reported", author: "Dieu" });

      const specs = engine.listSpecs();
      // Build markdown report similar to status command
      let md = "# Pipeline Status Report\n\n";
      md += `**Specs**: ${specs.length}\n\n`;
      md += "| ID | Title | Status | Branch |\n";
      md += "|----|-------|--------|--------|\n";
      for (const spec of specs) {
        const d = spec.data;
        md += `| ${d.id} | ${d.title} | ${d.status} | ${d.branch ?? "—"} |\n`;
      }

      expect(md).toContain("SPEC-001");
      expect(md).toContain("Report Feature");
      expect(md).toContain("draft");
      expect(md).toContain("SPEC-002");
      expect(md).toContain("Another Feature");
      expect(md).toContain("| ID | Title | Status | Branch |");
    });
  });
});
