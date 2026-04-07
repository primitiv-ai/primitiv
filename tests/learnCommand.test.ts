import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { saveState } from "../src/utils/ids.js";
import { runLearnAdd, runLearnList, runLearnSearch, runLearnRemove } from "../src/commands/learn.js";
import { PrimitivEngine } from "../src/engine/PrimitivEngine.js";
import { ensurePrimitivDir } from "../src/utils/fileSystem.js";

function initTestProject(): string {
  const dir = join(tmpdir(), `primitiv-learn-cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(dir, ".primitiv", "gates"), { recursive: true });
  mkdirSync(join(dir, ".primitiv", "constitutions"), { recursive: true });
  mkdirSync(join(dir, ".primitiv", "specs"), { recursive: true });
  mkdirSync(join(dir, ".primitiv", "learnings"), { recursive: true });
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync("git commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: "pipe" });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: "pipe" });
  saveState(dir, {
    nextSpecId: 1,
    nextFeatureId: 1,
    nextLearningId: 1,
    projectRoot: dir,
    mode: "brownfield",
    initializedAt: new Date().toISOString(),
  });
  return dir;
}

describe("CLI Learn Command", () => {
  let testDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    testDir = initTestProject();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    process.exitCode = undefined;
  });

  describe("Add learning via CLI", () => {
    beforeEach(async () => {
      await runLearnAdd(testDir, {
        type: "best-practice",
        title: "Use semantic HTML",
        tags: "accessibility,ui",
        severity: "important",
      });
    });

    it("a new learning file is created in .primitiv/learnings/", () => {
      const files = readdirSync(join(testDir, ".primitiv", "learnings"));
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/^LEARN-001-/);
    });

    it("a success message is printed with the learning ID", () => {
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("LEARN-001");
      expect(output).toContain("Use semantic HTML");
    });
  });

  describe("List learnings via CLI", () => {
    beforeEach(async () => {
      const engine = PrimitivEngine.load(testDir);
      engine.learnings.create({ learningType: "best-practice", title: "BP1", description: "d", tags: ["t1"] });
      engine.learnings.create({ learningType: "convention", title: "CONV1", description: "d", tags: ["t2"] });
    });

    it("a formatted table of learnings is displayed", async () => {
      await runLearnList(testDir, {});
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("LEARN-001");
      expect(output).toContain("LEARN-002");
    });

    it("the table includes columns for ID, Type, Title, Severity, and Tags", async () => {
      await runLearnList(testDir, {});
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("BP1");
      expect(output).toContain("best-practice");
      expect(output).toContain("t1");
    });
  });

  describe("Search learnings via CLI", () => {
    it("matching learnings are displayed", async () => {
      const engine = PrimitivEngine.load(testDir);
      engine.learnings.create({ learningType: "best-practice", title: "Always validate inputs", description: "Use Zod" });
      engine.learnings.create({ learningType: "convention", title: "Use ESLint", description: "Standard rules" });

      await runLearnSearch(testDir, "validate");
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("validate");
      expect(output).toContain("LEARN-001");
    });
  });

  describe("Remove learning via CLI", () => {
    beforeEach(async () => {
      const engine = PrimitivEngine.load(testDir);
      engine.learnings.create({ learningType: "best-practice", title: "To Remove", description: "d" });
    });

    it("the learning file is deleted", async () => {
      await runLearnRemove(testDir, "LEARN-001");
      const files = readdirSync(join(testDir, ".primitiv", "learnings"));
      expect(files).toHaveLength(0);
    });

    it("a success message confirms removal", async () => {
      await runLearnRemove(testDir, "LEARN-001");
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("Removed learning LEARN-001");
    });
  });

  describe("Error when no learnings found", () => {
    it("a message 'No learnings recorded yet' is displayed", async () => {
      await runLearnList(testDir, {});
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("No learnings recorded yet");
    });

    it("a hint to use primitiv learn add is shown", async () => {
      await runLearnList(testDir, {});
      const output = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("primitiv learn add");
    });
  });

  describe("Input validation", () => {
    it("rejects invalid type", async () => {
      await runLearnAdd(testDir, { type: "bad-type", title: "Test" });
      const output = errorSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("Invalid type");
      expect(process.exitCode).toBe(1);
    });

    it("rejects invalid severity", async () => {
      await runLearnAdd(testDir, { type: "best-practice", title: "Test", severity: "bad" });
      const output = errorSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("Invalid severity");
      expect(process.exitCode).toBe(1);
    });

    it("reports error for removing non-existent learning", async () => {
      await runLearnRemove(testDir, "LEARN-999");
      const output = errorSpy.mock.calls.map(c => c[0]).join("\n");
      expect(output).toContain("not found");
      expect(process.exitCode).toBe(1);
    });
  });
});

describe("Init Integration", () => {
  it("learnings directory created on init via ensurePrimitivDir", () => {
    const dir = join(tmpdir(), `primitiv-init-learn-${Date.now()}`);
    mkdirSync(dir, { recursive: true });

    ensurePrimitivDir(dir);

    expect(existsSync(join(dir, ".primitiv", "learnings"))).toBe(true);
    expect(existsSync(join(dir, ".primitiv", "specs"))).toBe(true);
    expect(existsSync(join(dir, ".primitiv", "gates"))).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });

  it("init with existing learnings directory preserves it", () => {
    const dir = join(tmpdir(), `primitiv-init-learn-${Date.now()}`);
    mkdirSync(join(dir, ".primitiv", "learnings"), { recursive: true });
    writeFileSync(join(dir, ".primitiv", "learnings", "test.md"), "test");

    ensurePrimitivDir(dir);

    expect(existsSync(join(dir, ".primitiv", "learnings", "test.md"))).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });
});
