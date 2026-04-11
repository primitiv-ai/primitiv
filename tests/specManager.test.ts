import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SpecManager } from "../src/engine/SpecManager.js";
import { AuditManager } from "../src/engine/AuditManager.js";
import { saveState } from "../src/utils/ids.js";
import { SpecNotFoundError, InvalidTransitionError } from "../src/utils/errors.js";
import { serializeDocument } from "../src/utils/frontmatter.js";

describe("SpecManager", () => {
  let testDir: string;
  let manager: SpecManager;

  beforeEach(() => {
    testDir = join(tmpdir(), `primitiv-specmgr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });
    saveState(testDir, {
      nextSpecId: 1,
      nextFeatureId: 1,

      mode: "greenfield",
      initializedAt: new Date().toISOString(),
    });
    manager = new SpecManager(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("create", () => {
    it("creates a spec with unique SPEC-XXX ID", () => {
      const spec = manager.create("User Authentication", "Add auth to the platform", undefined, "tester");
      expect(spec.id).toBe("SPEC-001");
      expect(spec.type).toBe("spec");
      expect(spec.title).toBe("User Authentication");
      expect(spec.status).toBe("draft");
      expect(spec.version).toBe(1);
    });

    it("creates spec directory at .primitiv/specs/SPEC-XXX-<slug>/", () => {
      manager.create("User Authentication", "Add auth", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-user-authentication");
      expect(existsSync(specDir)).toBe(true);
      expect(existsSync(join(specDir, "spec.md"))).toBe(true);
    });

    it("generated spec includes required sections", () => {
      manager.create("User Authentication", "Add auth to the platform", undefined, "tester");
      const specPath = join(testDir, ".primitiv", "specs", "SPEC-001-user-authentication", "spec.md");
      const content = readFileSync(specPath, "utf-8");
      expect(content).toContain("## Description");
      expect(content).toContain("Add auth to the platform");
      expect(content).toContain("## Acceptance Criteria");
      expect(content).toContain("## Test Strategy");
      expect(content).toContain("## Constraints");
      expect(content).toContain("## Out of Scope");
    });

    it("generates sequential IDs for multiple specs", () => {
      const spec1 = manager.create("Feature One", "First feature", undefined, "tester");
      const spec2 = manager.create("Feature Two", "Second feature", undefined, "tester");
      const spec3 = manager.create("Feature Three", "Third feature", undefined, "tester");
      expect(spec1.id).toBe("SPEC-001");
      expect(spec2.id).toBe("SPEC-002");
      expect(spec3.id).toBe("SPEC-003");
    });

    it("sets branch name as spec/<id>-<slug>", () => {
      const spec = manager.create("User Authentication", "Add auth", undefined, "tester");
      expect(spec.branch).toBe("spec/SPEC-001-user-authentication");
    });

    it("uses custom branch if provided", () => {
      const spec = manager.create("User Auth", "Auth", "custom/branch", "author");
      expect(spec.branch).toBe("custom/branch");
    });

    it("sets author if provided", () => {
      const spec = manager.create("Feature", "Desc", undefined, "John");
      expect(spec.author).toBe("John");
    });

    it("sets timestamps on creation", () => {
      const before = new Date().toISOString();
      const spec = manager.create("Feature", "Desc", undefined, "tester");
      const after = new Date().toISOString();
      expect(spec.createdAt).toBeDefined();
      expect(spec.updatedAt).toBeDefined();
      expect(spec.createdAt! >= before).toBe(true);
      expect(spec.createdAt! <= after).toBe(true);
    });
  });

  describe("create with audit trail", () => {
    it("appends SPEC_CREATED audit record when audit manager is set", () => {
      const audit = new AuditManager(testDir);
      manager.setAuditManager(audit);
      manager.create("Auth Feature", "Add authentication", undefined, "tester");
      const records = audit.readAuditLog("SPEC-001");
      expect(records.length).toBe(1);
      expect(records[0].action).toBe("SPEC_CREATED");
      expect(records[0].specId).toBe("SPEC-001");
      expect(records[0].newStatus).toBe("draft");
    });
  });

  describe("get", () => {
    it("retrieves a created spec by ID", () => {
      manager.create("Test Feature", "Some description", undefined, "tester");
      const doc = manager.get("SPEC-001");
      expect(doc.data.id).toBe("SPEC-001");
      expect(doc.data.title).toBe("Test Feature");
      expect(doc.data.status).toBe("draft");
    });

    it("throws SpecNotFoundError for non-existent spec", () => {
      expect(() => manager.get("SPEC-999")).toThrow(SpecNotFoundError);
    });
  });

  describe("list", () => {
    it("returns empty array when no specs exist", () => {
      const specs = manager.list();
      expect(specs).toEqual([]);
    });

    it("returns all specs", () => {
      manager.create("Feature A", "Desc A", undefined, "tester");
      manager.create("Feature B", "Desc B", undefined, "tester");
      const specs = manager.list();
      expect(specs).toHaveLength(2);
    });

    it("filters specs by status", () => {
      manager.create("Feature A", "Desc A", undefined, "tester");
      manager.create("Feature B", "Desc B", undefined, "tester");
      // All are draft status
      const drafts = manager.list({ status: "draft" });
      expect(drafts).toHaveLength(2);
      const planned = manager.list({ status: "planned" });
      expect(planned).toHaveLength(0);
    });
  });

  describe("listWithErrors", () => {
    it("returns empty ok and empty errors when no specs exist", () => {
      const result = manager.listWithErrors();
      expect(result.ok).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("returns all valid specs in ok with no errors", () => {
      manager.create("Feature A", "Desc A", undefined, "tester");
      manager.create("Feature B", "Desc B", undefined, "tester");
      const result = manager.listWithErrors();
      expect(result.ok).toHaveLength(2);
      expect(result.errors).toEqual([]);
    });

    it("surfaces malformed specs in errors instead of silently skipping", () => {
      manager.create("Good Feature", "Valid spec", undefined, "tester");
      // Manually write a malformed spec with unterminated YAML string
      const badDir = join(testDir, ".primitiv", "specs", "SPEC-999-broken");
      mkdirSync(badDir, { recursive: true });
      writeFileSync(
        join(badDir, "spec.md"),
        '---\ntitle: "unterminated string\nid: SPEC-999\n---\n\n# Broken\n',
      );

      const result = manager.listWithErrors();
      expect(result.ok).toHaveLength(1);
      expect(result.ok[0].data.id).toBe("SPEC-001");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].dir).toBe("SPEC-999-broken");
      expect(result.errors[0].file).toBe("spec.md");
      expect(result.errors[0].error.length).toBeGreaterThan(0);
    });

    it("filter.status applies to ok but not to errors", () => {
      manager.create("Feature A", "Desc A", undefined, "tester");
      // Add a malformed spec
      const badDir = join(testDir, ".primitiv", "specs", "SPEC-999-broken");
      mkdirSync(badDir, { recursive: true });
      writeFileSync(
        join(badDir, "spec.md"),
        '---\ntitle: "unterminated\n---\n\n# Broken\n',
      );

      // filter to "planned" — SPEC-001 is draft, should be excluded from ok
      const result = manager.listWithErrors({ status: "planned" });
      expect(result.ok).toHaveLength(0);
      // errors still reported regardless of filter
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("updateStatus", () => {
    it("updates spec status with valid transition", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      manager.updateStatus("SPEC-001", "gate-1-passed");
      const updated = manager.get("SPEC-001");
      expect(updated.data.status).toBe("gate-1-passed");
    });

    it("throws InvalidTransitionError for invalid transition", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      expect(() => manager.updateStatus("SPEC-001", "completed")).toThrow(InvalidTransitionError);
    });

    it("updates the updatedAt timestamp on status change", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const before = manager.get("SPEC-001").data.updatedAt;
      manager.updateStatus("SPEC-001", "gate-1-passed");
      const after = manager.get("SPEC-001").data.updatedAt;
      expect(after).toBeDefined();
      expect(after! >= before!).toBe(true);
    });

    it("appends STATUS_CHANGED audit record when audit manager is set", () => {
      const audit = new AuditManager(testDir);
      manager.setAuditManager(audit);
      manager.create("Feature", "Desc", undefined, "tester");
      manager.updateStatus("SPEC-001", "gate-1-passed");
      const records = audit.readAuditLog("SPEC-001");
      const statusChange = records.find(r => r.action === "STATUS_CHANGED");
      expect(statusChange).toBeDefined();
      expect(statusChange!.previousStatus).toBe("draft");
      expect(statusChange!.newStatus).toBe("gate-1-passed");
    });
  });

  describe("getPlan", () => {
    it("returns null when no plan exists", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      expect(manager.getPlan("SPEC-001")).toBeNull();
    });

    it("returns plan when plan.md exists", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-feature");
      const planData = {
        type: "plan",
        version: 1,
        specId: "SPEC-001",
        approach: "Build it",
        fileChanges: [],
      };
      writeFileSync(join(specDir, "plan.md"), serializeDocument(planData, "# Plan content"));
      const plan = manager.getPlan("SPEC-001");
      expect(plan).not.toBeNull();
      expect(plan!.data.specId).toBe("SPEC-001");
      expect(plan!.data.approach).toBe("Build it");
    });
  });

  describe("getTasks", () => {
    it("returns null when no tasks exist", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      expect(manager.getTasks("SPEC-001")).toBeNull();
    });

    it("returns tasks when tasks.md exists", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-feature");
      const tasksData = {
        type: "tasks",
        version: 1,
        specId: "SPEC-001",
        tasks: [
          { id: "TASK-001", title: "First task", status: "pending", files: [], acceptanceCriteria: [], dependsOn: [] },
        ],
      };
      writeFileSync(join(specDir, "tasks.md"), serializeDocument(tasksData, "# Tasks"));
      const tasks = manager.getTasks("SPEC-001");
      expect(tasks).not.toBeNull();
      expect(tasks!.data.tasks).toHaveLength(1);
    });
  });

  describe("getSpecGraph", () => {
    it("returns full spec graph with all artifacts", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.spec.data.id).toBe("SPEC-001");
      expect(graph.plan).toBeNull();
      expect(graph.tasks).toBeNull();
      expect(graph.testResults).toBeNull();
      expect(graph.clarifications).toBeNull();
      expect(graph.research).toBeNull();
      expect(graph.checklistFiles).toEqual([]);
      expect(graph.dataModelFiles).toEqual([]);
    });

    it("includes clarifications when they exist", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-feature");
      writeFileSync(join(specDir, "clarifications.md"), "# Clarifications\n\nSome clarifications here.");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.clarifications).not.toBeNull();
      expect(graph.clarifications).toContain("Some clarifications here");
    });

    it("includes raw research content when research.md exists", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-feature");
      writeFileSync(join(specDir, "research.md"), "# Research\n\nSome research notes.");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.research).not.toBeNull();
      expect(graph.research).toContain("Some research notes");
    });

    it("returns research as null when research.md is absent", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.research).toBeNull();
    });

    it("lists files inside checklists/ when the directory exists", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-feature");
      const checklistsDir = join(specDir, "checklists");
      mkdirSync(checklistsDir, { recursive: true });
      writeFileSync(join(checklistsDir, "review.md"), "# Review\n");
      writeFileSync(join(checklistsDir, "deploy.md"), "# Deploy\n");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.checklistFiles).toHaveLength(2);
      expect(graph.checklistFiles.sort()).toEqual(["deploy.md", "review.md"]);
    });

    it("returns checklistFiles as empty array when directory is absent", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.checklistFiles).toEqual([]);
    });

    it("lists files inside data-model/ when the directory exists", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const specDir = join(testDir, ".primitiv", "specs", "SPEC-001-feature");
      const dataModelDir = join(specDir, "data-model");
      mkdirSync(dataModelDir, { recursive: true });
      writeFileSync(join(dataModelDir, "entities.md"), "# Entities\n");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.dataModelFiles).toEqual(["entities.md"]);
    });

    it("returns dataModelFiles as empty array when directory is absent", () => {
      manager.create("Feature", "Desc", undefined, "tester");
      const graph = manager.getSpecGraph("SPEC-001");
      expect(graph.dataModelFiles).toEqual([]);
    });
  });
});
