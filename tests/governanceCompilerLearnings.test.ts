import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { GovernanceCompiler, COMPILER_VERSION } from "../src/engine/GovernanceCompiler.js";
import { LearningManager } from "../src/engine/LearningManager.js";
import { writeFileSync } from "node:fs";

function createTempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "primitiv-gov-learnings-"));
  mkdirSync(join(dir, ".primitiv", "gates"), { recursive: true });
  mkdirSync(join(dir, ".primitiv", "constitutions"), { recursive: true });
  mkdirSync(join(dir, ".primitiv", "learnings"), { recursive: true });
  mkdirSync(join(dir, ".primitiv", "specs"), { recursive: true });

  writeFileSync(
    join(dir, ".primitiv", ".state.json"),
    JSON.stringify({
      nextSpecId: 1,
      nextFeatureId: 1,
      nextLearningId: 1,

      mode: "brownfield",
      initializedAt: new Date().toISOString(),
    }),
  );

  execSync("git init", { cwd: dir, stdio: "ignore" });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: "ignore" });
  execSync('git config user.name "Test"', { cwd: dir, stdio: "ignore" });

  return dir;
}

describe("GovernanceCompiler — Learnings Integration", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTempProject();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("COMPILER_VERSION is '1.2'", () => {
    expect(COMPILER_VERSION).toBe("1.2");
  });

  it("compiled context includes learnings array when learnings exist", () => {
    const manager = new LearningManager(testDir);
    manager.create({
      learningType: "best-practice",
      title: "Always validate inputs",
      description: "Input validation prevents injection attacks.",
      tags: ["validation", "security"],
      severity: "important",
    });
    manager.create({
      learningType: "convention",
      title: "Use connection pooling",
      description: "Connection pooling reduces latency.",
      tags: ["database"],
    });

    const compiler = new GovernanceCompiler(testDir);
    const ctx = compiler.compile();

    expect(ctx.learnings).toHaveLength(2);

    const ids = ctx.learnings.map(l => l.id).sort();
    expect(ids).toEqual(["LEARN-001", "LEARN-002"]);

    const learn1 = ctx.learnings.find(l => l.id === "LEARN-001")!;
    expect(learn1.title).toBe("Always validate inputs");
    expect(learn1.learningType).toBe("best-practice");
    expect(learn1.severity).toBe("important");
    expect(learn1.description).toContain("injection attacks");

    const learn2 = ctx.learnings.find(l => l.id === "LEARN-002")!;
    expect(learn2.title).toBe("Use connection pooling");
    expect(learn2.description).toContain("Connection pooling");
  });

  it("compiled context has empty learnings array when none exist", () => {
    const compiler = new GovernanceCompiler(testDir);
    const ctx = compiler.compile();

    expect(ctx.learnings).toEqual([]);
  });

  it("source hash changes when learnings are added", () => {
    const compiler = new GovernanceCompiler(testDir);
    const ctx1 = compiler.compile();

    const manager = new LearningManager(testDir);
    manager.create({
      learningType: "best-practice",
      title: "New learning",
      description: "A new learning was discovered.",
      tags: [],
    });

    expect(compiler.isStale(ctx1)).toBe(true);

    const ctx2 = compiler.compile();
    expect(ctx2.sourceHash).not.toBe(ctx1.sourceHash);
  });

  it("learnings data matches LearningManager output", () => {
    const manager = new LearningManager(testDir);
    manager.create({
      learningType: "error-resolution",
      title: "Test learning",
      description: "Testing is important.",
      tags: ["test"],
      source: "test-failure",
    });

    const records = manager.list();
    expect(records).toHaveLength(1);

    const compiler = new GovernanceCompiler(testDir);
    const ctx = compiler.compile();

    expect(ctx.learnings).toHaveLength(1);
    expect(ctx.learnings[0].id).toBe(records[0].data.id);
    expect(ctx.learnings[0].title).toBe(records[0].data.title);
    expect(ctx.learnings[0].description).toBe(records[0].description);
  });
});
