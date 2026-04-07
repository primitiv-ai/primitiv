import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { LearningManager } from "../src/engine/LearningManager.js";

function createTempProject(): string {
  const root = mkdtempSync(join(tmpdir(), "primitiv-learning-"));
  mkdirSync(join(root, ".primitiv", "learnings"), { recursive: true });
  writeFileSync(
    join(root, ".primitiv", ".state.json"),
    JSON.stringify({
      nextSpecId: 1,
      nextFeatureId: 1,
      nextLearningId: 1,
      projectRoot: root,
      mode: "brownfield",
      initializedAt: new Date().toISOString(),
    }),
  );
  // Init git so getGitUser works
  execSync("git init", { cwd: root, stdio: "ignore" });
  execSync('git config user.name "Test User"', { cwd: root, stdio: "ignore" });
  execSync('git config user.email "test@test.com"', { cwd: root, stdio: "ignore" });
  return root;
}

describe("LearningManager", () => {
  let root: string;
  let manager: LearningManager;

  beforeEach(() => {
    root = createTempProject();
    manager = new LearningManager(root);
  });

  describe("create", () => {
    it("creates a learning file with correct frontmatter and body", () => {
      const result = manager.create({
        learningType: "best-practice",
        title: "Always validate env vars at startup",
        description: "Use Zod schema to validate all environment variables.",
        tags: ["validation", "configuration"],
      });

      expect(result.data.id).toBe("LEARN-001");
      expect(result.data.learningType).toBe("best-practice");
      expect(result.data.title).toBe("Always validate env vars at startup");
      expect(result.data.source).toBe("user");
      expect(result.data.tags).toEqual(["validation", "configuration"]);
      expect(result.data.severity).toBe("info");
      expect(result.data.author).toBe("Test User");
      expect(result.description).toBe("Use Zod schema to validate all environment variables.");

      // Verify file exists
      const learningsDir = join(root, ".primitiv", "learnings");
      const files = require("node:fs").readdirSync(learningsDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/^LEARN-001-/);
    });

    it("increments nextLearningId in state file", () => {
      manager.create({
        learningType: "best-practice",
        title: "First learning",
        description: "desc",
      });
      manager.create({
        learningType: "convention",
        title: "Second learning",
        description: "desc",
      });

      const state = JSON.parse(
        readFileSync(join(root, ".primitiv", ".state.json"), "utf-8"),
      );
      expect(state.nextLearningId).toBe(3);
    });

    it("creates error-resolution learning linked to a spec", () => {
      const result = manager.create({
        learningType: "error-resolution",
        title: "Fix circular dependency in GovernanceCompiler",
        description: "Resolved by restructuring imports.",
        source: "gate-failure",
        specId: "SPEC-005",
        severity: "important",
      });

      expect(result.data.id).toBe("LEARN-001");
      expect(result.data.learningType).toBe("error-resolution");
      expect(result.data.source).toBe("gate-failure");
      expect(result.data.specId).toBe("SPEC-005");
      expect(result.data.severity).toBe("important");
    });
  });

  describe("list", () => {
    it("returns all learnings sorted by createdAt descending", () => {
      manager.create({
        learningType: "best-practice",
        title: "First",
        description: "desc 1",
      });
      // Small delay to ensure different timestamps
      manager.create({
        learningType: "error-resolution",
        title: "Second",
        description: "desc 2",
      });

      const all = manager.list();
      expect(all).toHaveLength(2);
      // Newest first
      expect(all[0].data.id).toBe("LEARN-002");
      expect(all[1].data.id).toBe("LEARN-001");
    });

    it("returns empty array when no learnings exist", () => {
      expect(manager.list()).toEqual([]);
    });

    it("filters by learningType", () => {
      manager.create({ learningType: "best-practice", title: "BP", description: "d" });
      manager.create({ learningType: "error-resolution", title: "ER", description: "d" });
      manager.create({ learningType: "best-practice", title: "BP2", description: "d" });

      const filtered = manager.list({ learningType: "best-practice" });
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.data.learningType === "best-practice")).toBe(true);
    });

    it("filters by tag", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", tags: ["testing"] });
      manager.create({ learningType: "convention", title: "T2", description: "d", tags: ["security"] });

      const filtered = manager.list({ tag: "testing" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].data.title).toBe("T1");
    });

    it("filters by severity", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", severity: "critical" });
      manager.create({ learningType: "convention", title: "T2", description: "d", severity: "info" });

      const filtered = manager.list({ severity: "critical" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].data.title).toBe("T1");
    });

    it("filters by source", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", source: "user" });
      manager.create({ learningType: "error-resolution", title: "T2", description: "d", source: "gate-failure" });

      const filtered = manager.list({ source: "gate-failure" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].data.title).toBe("T2");
    });
  });

  describe("get", () => {
    it("returns a learning by ID", () => {
      manager.create({ learningType: "best-practice", title: "Test", description: "d" });
      const result = manager.get("LEARN-001");
      expect(result).not.toBeNull();
      expect(result!.data.title).toBe("Test");
    });

    it("returns null for non-existent ID", () => {
      expect(manager.get("LEARN-999")).toBeNull();
    });
  });

  describe("search", () => {
    it("matches title", () => {
      manager.create({ learningType: "best-practice", title: "Always validate env vars", description: "d" });
      manager.create({ learningType: "convention", title: "Use ESLint rules", description: "d" });

      const results = manager.search("validate");
      expect(results).toHaveLength(1);
      expect(results[0].data.title).toBe("Always validate env vars");
    });

    it("matches description", () => {
      manager.create({ learningType: "best-practice", title: "Env validation", description: "Use Zod schema for all env vars" });
      manager.create({ learningType: "convention", title: "ESLint", description: "Follow standard rules" });

      const results = manager.search("Zod");
      expect(results).toHaveLength(1);
      expect(results[0].data.title).toBe("Env validation");
    });

    it("is case-insensitive", () => {
      manager.create({ learningType: "best-practice", title: "Use ZOD for validation", description: "d" });
      const results = manager.search("zod");
      expect(results).toHaveLength(1);
    });

    it("returns empty for no matches", () => {
      manager.create({ learningType: "best-practice", title: "Test", description: "desc" });
      expect(manager.search("nonexistent")).toEqual([]);
    });
  });

  describe("delete", () => {
    it("removes a learning file", () => {
      manager.create({ learningType: "best-practice", title: "To delete", description: "d" });
      expect(manager.list()).toHaveLength(1);

      const deleted = manager.delete("LEARN-001");
      expect(deleted).toBe(true);
      expect(manager.list()).toHaveLength(0);
    });

    it("returns false for non-existent learning", () => {
      expect(manager.delete("LEARN-999")).toBe(false);
    });

    it("does not affect other learnings", () => {
      manager.create({ learningType: "best-practice", title: "Keep", description: "d" });
      manager.create({ learningType: "convention", title: "Delete", description: "d" });

      manager.delete("LEARN-002");
      const remaining = manager.list();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].data.id).toBe("LEARN-001");
    });
  });

  describe("findRelevant", () => {
    it("matches learnings by tag keywords", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", tags: ["validation", "testing"] });
      manager.create({ learningType: "convention", title: "T2", description: "d", tags: ["security"] });
      manager.create({ learningType: "best-practice", title: "T3", description: "d", tags: ["api", "validation"] });

      const relevant = manager.findRelevant(["validation"]);
      expect(relevant).toHaveLength(2);
    });

    it("is case-insensitive", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", tags: ["Testing"] });
      const relevant = manager.findRelevant(["testing"]);
      expect(relevant).toHaveLength(1);
    });

    it("returns empty for no keyword matches", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", tags: ["database"] });
      expect(manager.findRelevant(["frontend"])).toEqual([]);
    });

    it("returns empty for empty keywords", () => {
      manager.create({ learningType: "best-practice", title: "T1", description: "d", tags: ["testing"] });
      expect(manager.findRelevant([])).toEqual([]);
    });
  });
});
