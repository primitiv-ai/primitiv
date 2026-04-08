import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

// Mock @clack/prompts
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
  confirm: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// Mock banner/box to avoid gradient-string in tests
vi.mock("../src/ui/banner.js", () => ({
  renderBanner: vi.fn(async () => "BANNER"),
  renderCompactBanner: vi.fn(() => "compact-banner"),
}));

vi.mock("../src/ui/box.js", () => ({
  renderBox: vi.fn(() => "BOX"),
}));

// Mock init functions to avoid template resolution issues in worktrees
vi.mock("../src/init/greenfield.js", () => ({
  initGreenfield: vi.fn((dir: string) => {
    // Create .primitiv to simulate initialization
    mkdirSync(join(dir, ".primitiv"), { recursive: true });
    return {
      mode: "greenfield",
      directories: [".primitiv/gates", ".primitiv/constitutions", ".primitiv/specs"],
      commands: ["primitiv.company-principles.md", "primitiv.specify.md"],
      gitNexusInstalled: true,
    };
  }),
}));

vi.mock("../src/init/brownfield.js", () => ({
  initBrownfield: vi.fn((dir: string) => {
    // Create .primitiv to simulate initialization
    mkdirSync(join(dir, ".primitiv"), { recursive: true });
    return {
      mode: "brownfield",
      directories: [".primitiv/gates", ".primitiv/constitutions", ".primitiv/specs"],
      commands: ["primitiv.company-principles.md", "primitiv.specify.md"],
      gitNexusInstalled: true,
      detectedStack: {
        languages: ["TypeScript", "JavaScript"],
        frameworks: ["React"],
        databases: ["PostgreSQL"],
        packageManager: "npm",
      },
    };
  }),
}));

import * as p from "@clack/prompts";
import { runInit } from "../src/commands/init.js";
import { renderBanner } from "../src/ui/banner.js";
import { initGreenfield } from "../src/init/greenfield.js";
import { initBrownfield } from "../src/init/brownfield.js";

describe("init wizard", () => {
  let testDir: string;

  function createTestDir(): string {
    const dir = join(
      tmpdir(),
      `primitiv-init-wizard-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(dir, { recursive: true });
    execSync("git init", { cwd: dir, stdio: "pipe" });
    execSync("git commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
    return dir;
  }

  beforeEach(() => {
    testDir = createTestDir();
    vi.clearAllMocks();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  // ── Non-interactive mode (--yes) ──────────────────────────────────────────

  describe("non-interactive mode (--yes)", () => {
    it("does not print banner", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      await runInit(testDir, { yes: true });

      expect(renderBanner).not.toHaveBeenCalled();
      const allLogs = consoleSpy.mock.calls.flat().join(" ");
      expect(allLogs).not.toContain("BANNER");
      consoleSpy.mockRestore();
    });

    it("does not show any prompts", async () => {
      await runInit(testDir, { yes: true });

      expect(p.intro).not.toHaveBeenCalled();
      expect(p.select).not.toHaveBeenCalled();
      expect(p.confirm).not.toHaveBeenCalled();
    });

    it("defaults to brownfield mode", async () => {
      await runInit(testDir, { yes: true });

      expect(initBrownfield).toHaveBeenCalledWith(testDir);
      expect(initGreenfield).not.toHaveBeenCalled();
    });

    it("outputs chalk-based messages for CI", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      await runInit(testDir, { yes: true });

      const allLogs = consoleSpy.mock.calls.flat().join(" ");
      expect(allLogs).toContain("brownfield");
      consoleSpy.mockRestore();
    });
  });

  // ── Flag mode (--greenfield) ──────────────────────────────────────────────

  describe("flag mode (--greenfield)", () => {
    it("prints banner", async () => {
      await runInit(testDir, { greenfield: true });

      expect(renderBanner).toHaveBeenCalled();
    });

    it("calls initGreenfield without showing select prompt", async () => {
      await runInit(testDir, { greenfield: true });

      expect(p.select).not.toHaveBeenCalled();
      expect(initGreenfield).toHaveBeenCalledWith(testDir);
      expect(initBrownfield).not.toHaveBeenCalled();
    });

    it("shows spinner and success", async () => {
      await runInit(testDir, { greenfield: true });

      expect(p.spinner).toHaveBeenCalled();
      expect(p.outro).toHaveBeenCalledWith("Done!");
    });
  });

  // ── Flag mode (--brownfield) ──────────────────────────────────────────────

  describe("flag mode (--brownfield)", () => {
    it("prints banner and calls initBrownfield", async () => {
      await runInit(testDir, { brownfield: true });

      expect(renderBanner).toHaveBeenCalled();
      expect(p.select).not.toHaveBeenCalled();
      expect(initBrownfield).toHaveBeenCalledWith(testDir);
      expect(initGreenfield).not.toHaveBeenCalled();
    });
  });

  // ── Already initialized ───────────────────────────────────────────────────

  describe("already initialized", () => {
    it("warns in interactive mode when already initialized", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });

      await runInit(testDir, {});

      expect(p.log.warn).toHaveBeenCalledWith(
        expect.stringContaining("already initialized")
      );
      expect(initGreenfield).not.toHaveBeenCalled();
      expect(initBrownfield).not.toHaveBeenCalled();
    });

    it("warns in flag mode when already initialized", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });

      await runInit(testDir, { greenfield: true });

      expect(p.log.warn).toHaveBeenCalledWith(
        expect.stringContaining("already initialized")
      );
      expect(initGreenfield).not.toHaveBeenCalled();
    });

    it("warns in non-interactive mode when already initialized", async () => {
      mkdirSync(join(testDir, ".primitiv"), { recursive: true });

      const consoleSpy = vi.spyOn(console, "log");
      await runInit(testDir, { yes: true });

      const allLogs = consoleSpy.mock.calls.flat().join(" ");
      expect(allLogs).toContain("already initialized");
      expect(initBrownfield).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ── Interactive mode ──────────────────────────────────────────────────────

  describe("interactive mode", () => {
    it("prints banner and shows select prompt", async () => {
      vi.mocked(p.select).mockResolvedValue("greenfield");

      await runInit(testDir, {});

      expect(renderBanner).toHaveBeenCalled();
      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "What kind of project is this?",
        })
      );
      expect(initGreenfield).toHaveBeenCalledWith(testDir);
    });

    it("runs brownfield when selected", async () => {
      vi.mocked(p.select).mockResolvedValue("brownfield");

      await runInit(testDir, {});

      expect(initBrownfield).toHaveBeenCalledWith(testDir);
      expect(initGreenfield).not.toHaveBeenCalled();
    });

    it("handles cancel from select", async () => {
      const cancelSymbol = Symbol("cancel");
      vi.mocked(p.select).mockResolvedValue(cancelSymbol);
      vi.mocked(p.isCancel).mockImplementation((value) => value === cancelSymbol);

      await runInit(testDir, {});

      expect(p.cancel).toHaveBeenCalledWith("Init cancelled.");
      expect(initGreenfield).not.toHaveBeenCalled();
      expect(initBrownfield).not.toHaveBeenCalled();
    });
  });

  // ── No git repo ───────────────────────────────────────────────────────────

  describe("no git repo", () => {
    let noGitDir: string;

    beforeEach(() => {
      noGitDir = join(
        tmpdir(),
        `primitiv-no-git-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      mkdirSync(noGitDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(noGitDir, { recursive: true, force: true });
    });

    it("errors in non-interactive mode when not a git repo", async () => {
      const consoleSpy = vi.spyOn(console, "error");
      await runInit(noGitDir, { yes: true });

      const allErrors = consoleSpy.mock.calls.flat().join(" ");
      expect(allErrors).toContain("Not a git repository");
      expect(initBrownfield).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("prompts to init git in interactive mode", async () => {
      vi.mocked(p.confirm).mockResolvedValue(true);
      vi.mocked(p.select).mockResolvedValue("greenfield");

      await runInit(noGitDir, {});

      expect(p.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No git repo found. Initialize one?",
        })
      );
      // After confirming, git should be initialized
      expect(existsSync(join(noGitDir, ".git"))).toBe(true);
      expect(initGreenfield).toHaveBeenCalled();
    });

    it("cancels when user declines git init", async () => {
      vi.mocked(p.confirm).mockResolvedValue(false);

      await runInit(noGitDir, {});

      expect(p.cancel).toHaveBeenCalledWith(
        "Cannot proceed without a git repository."
      );
      expect(initGreenfield).not.toHaveBeenCalled();
      expect(initBrownfield).not.toHaveBeenCalled();
    });

    it("prompts to init git in flag mode", async () => {
      vi.mocked(p.confirm).mockResolvedValue(true);

      await runInit(noGitDir, { brownfield: true });

      expect(p.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No git repo found. Initialize one?",
        })
      );
      expect(existsSync(join(noGitDir, ".git"))).toBe(true);
      expect(initBrownfield).toHaveBeenCalled();
    });
  });
});
