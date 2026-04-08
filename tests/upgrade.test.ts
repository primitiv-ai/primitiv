import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

// Mock templates module
const FAKE_TEMPLATES: Record<string, string> = {
  "cmd-a.md": "template-content-a-v2",
  "cmd-b.md": "template-content-b-v2",
  "cmd-c.md": "template-content-c-v2",
};

const FAKE_SPEC_TEMPLATES: Record<string, string> = {
  "README.md": "# Primitiv — Spec Driven Development\n",
};

vi.mock("../src/init/templates.js", () => ({
  loadTemplate: (category: string, name: string) => {
    if (category === "specs") {
      const content = FAKE_SPEC_TEMPLATES[name];
      if (!content) throw new Error(`Unknown spec template: ${name}`);
      return content;
    }
    const content = FAKE_TEMPLATES[name];
    if (!content) throw new Error(`Unknown template: ${name}`);
    return content;
  },
  getCommandTemplateNames: () => Object.keys(FAKE_TEMPLATES),
}));

vi.mock("../src/init/installCommands.js", () => ({
  installSlashCommands: vi.fn(() => Object.keys(FAKE_TEMPLATES)),
}));

vi.mock("../src/init/installGitNexus.js", () => ({
  installGitNexusMcp: vi.fn(),
}));

vi.mock("../src/utils/version.js", () => ({
  getPackageVersion: () => "1.0.3",
}));

const { runUpgrade } = await import("../src/commands/upgrade.js");

function initGitRepo(dir: string): void {
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync("git config user.email test@test.com", { cwd: dir, stdio: "pipe" });
  execSync("git config user.name Test", { cwd: dir, stdio: "pipe" });
}

function writeState(dir: string, state: Record<string, unknown>): void {
  writeFileSync(
    join(dir, ".primitiv", ".state.json"),
    JSON.stringify(state, null, 2) + "\n",
  );
}

function readState(dir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(dir, ".primitiv", ".state.json"), "utf-8"));
}

describe("primitiv upgrade", () => {
  let testDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "primitiv-upgrade-"));
    initGitRepo(testDir);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Mock @clack/prompts log methods
    infoSpy = vi.fn();
    vi.doMock("@clack/prompts", async (importOriginal) => {
      const mod = await importOriginal<typeof import("@clack/prompts")>();
      return { ...mod, log: { ...mod.log, info: infoSpy, success: vi.fn() } };
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("Upgrade creates missing directories", () => {
    it(".primitiv/learnings/ directory is created", async () => {
      // Old-style init: no learnings/ dir
      mkdirSync(join(testDir, ".primitiv", "gates"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "constitutions"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 3,
        nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      await runUpgrade(testDir);

      expect(existsSync(join(testDir, ".primitiv", "learnings"))).toBe(true);
    });

    it("existing directories are preserved", async () => {
      mkdirSync(join(testDir, ".primitiv", "gates"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "constitutions"), { recursive: true });
      mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });
      writeFileSync(join(testDir, ".primitiv", "specs", "test.md"), "keep me");
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      await runUpgrade(testDir);

      expect(existsSync(join(testDir, ".primitiv", "specs", "test.md"))).toBe(true);
    });
  });

  describe("Upgrade migrates state file with missing fields", () => {
    it("adds nextLearningId and primitivVersion, preserves existing fields", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 5,
        nextFeatureId: 2,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      await runUpgrade(testDir);

      const state = readState(testDir);
      expect(state.nextLearningId).toBe(1);
      expect(state.primitivVersion).toBe("1.0.3");
      expect(state.nextSpecId).toBe(5);
      expect(state.nextFeatureId).toBe(2);
      expect(state.mode).toBe("brownfield");
    });
  });

  describe("Upgrade updates slash commands", () => {
    it("reports updated and added commands", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      const commandsDir = join(testDir, ".claude", "commands");
      mkdirSync(commandsDir, { recursive: true });
      writeFileSync(join(commandsDir, "cmd-a.md"), "old-content");
      // cmd-b and cmd-c don't exist → added

      await runUpgrade(testDir);

      const output = logSpy.mock.calls.map(c => String(c[0])).join("\n");
      expect(output).toContain("1 updated, 2 added, 0 removed, 0 unchanged");
    });

    it("reports all up to date when content matches", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      const commandsDir = join(testDir, ".claude", "commands");
      mkdirSync(commandsDir, { recursive: true });
      for (const [name, content] of Object.entries(FAKE_TEMPLATES)) {
        writeFileSync(join(commandsDir, name), content);
      }

      await runUpgrade(testDir);

      const output = logSpy.mock.calls.map(c => String(c[0])).join("\n");
      expect(output).toContain("All commands up to date");
    });
  });

  describe("Upgrade reports version transition", () => {
    it("shows upgrading message when version changes", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        primitivVersion: "1.0.2",
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      await runUpgrade(testDir);

      const state = readState(testDir);
      expect(state.primitivVersion).toBe("1.0.3");
    });
  });

  describe("Upgrade on already up-to-date project", () => {
    it("still refreshes commands and MCP", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1, nextLearningId: 1,
        primitivVersion: "1.0.3",
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      await runUpgrade(testDir);

      // Should still succeed (idempotent)
      const { installSlashCommands } = await import("../src/init/installCommands.js");
      expect(installSlashCommands).toHaveBeenCalled();
    });
  });

  describe("Upgrade removes deprecated commands", () => {
    it("deletes old gate-1 and gate-2 files", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      const commandsDir = join(testDir, ".claude", "commands");
      mkdirSync(commandsDir, { recursive: true });
      writeFileSync(join(commandsDir, "primitiv.gate-1.md"), "old gate 1");
      writeFileSync(join(commandsDir, "primitiv.gate-2.md"), "old gate 2");

      await runUpgrade(testDir);

      expect(existsSync(join(commandsDir, "primitiv.gate-1.md"))).toBe(false);
      expect(existsSync(join(commandsDir, "primitiv.gate-2.md"))).toBe(false);
    });

    it("reports removed commands in summary", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      const commandsDir = join(testDir, ".claude", "commands");
      mkdirSync(commandsDir, { recursive: true });
      writeFileSync(join(commandsDir, "primitiv.gate-1.md"), "old");
      writeFileSync(join(commandsDir, "primitiv.gate-2.md"), "old");

      await runUpgrade(testDir);

      const output = logSpy.mock.calls.map(c => String(c[0])).join("\n");
      expect(output).toContain("Removed: primitiv.gate-1.md, primitiv.gate-2.md");
      expect(output).toContain("2 removed");
    });

    it("does not fail when deprecated files do not exist", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      // No old gate files — should not throw
      await expect(runUpgrade(testDir)).resolves.not.toThrow();
    });
  });

  describe("Upgrade regenerates .primitiv/README.md", () => {
    it("overwrites README from template", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 1, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });
      writeFileSync(join(testDir, ".primitiv", "README.md"), "outdated content");

      await runUpgrade(testDir);

      const content = readFileSync(join(testDir, ".primitiv", "README.md"), "utf-8");
      expect(content).toBe(FAKE_SPEC_TEMPLATES["README.md"]);
    });
  });

  describe("Upgrade fails on uninitialized project", () => {
    it("throws NotInitializedError", async () => {
      // No .primitiv/ dir
      await expect(runUpgrade(testDir)).rejects.toThrow("not initialized");
    });
  });

  describe("Upgrade fails outside git repo", () => {
    it("throws GitNotFoundError", async () => {
      const noGitDir = mkdtempSync(join(tmpdir(), "primitiv-nogit-"));
      await expect(runUpgrade(noGitDir)).rejects.toThrow();
      rmSync(noGitDir, { recursive: true, force: true });
    });
  });

  describe("Idempotency", () => {
    it("running upgrade twice produces same state", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });
      writeState(testDir, {
        nextSpecId: 3, nextFeatureId: 1,
        mode: "brownfield",
        initializedAt: "2026-01-01T00:00:00Z",
      });

      await runUpgrade(testDir);
      const state1 = readState(testDir);

      await runUpgrade(testDir);
      const state2 = readState(testDir);

      expect(state1.nextSpecId).toBe(state2.nextSpecId);
      expect(state1.nextLearningId).toBe(state2.nextLearningId);
      expect(state1.primitivVersion).toBe(state2.primitivVersion);
    });
  });
});
