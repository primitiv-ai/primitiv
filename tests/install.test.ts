import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  log: {
    success: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("../src/git/gitGuard.js", () => ({
  assertGitRepo: vi.fn(),
}));

vi.mock("../src/utils/fileSystem.js", () => ({
  isPrimitivInitialized: vi.fn(() => false),
}));

vi.mock("../src/commands/init.js", () => ({
  runInit: vi.fn(),
}));

import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { assertGitRepo } from "../src/git/gitGuard.js";
import { isPrimitivInitialized } from "../src/utils/fileSystem.js";
import { runInit } from "../src/commands/init.js";
import { runInstall } from "../src/commands/install.js";

const mockedExecSync = vi.mocked(execSync);
const mockedAssertGitRepo = vi.mocked(assertGitRepo);
const mockedIsPrimitivInitialized = vi.mocked(isPrimitivInitialized);
const mockedRunInit = vi.mocked(runInit);

describe("runInstall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAssertGitRepo.mockImplementation(() => undefined);
    mockedIsPrimitivInitialized.mockReturnValue(false);
    mockedExecSync.mockReturnValue(Buffer.from(""));
    mockedRunInit.mockResolvedValue(undefined);
  });

  it("calls npm install -g primitiv on global install step", async () => {
    await runInstall("/tmp/test-project");

    expect(mockedExecSync).toHaveBeenCalledWith("npm install -g primitiv", {
      stdio: "pipe",
    });
  });

  it("delegates to runInit after successful global install", async () => {
    await runInstall("/tmp/test-project");

    expect(mockedRunInit).toHaveBeenCalledWith("/tmp/test-project", {});
    expect(p.outro).toHaveBeenCalledWith(
      "primitiv is ready. Run 'primitiv --help' to see all commands."
    );
  });

  it("shows permission error on EACCES failure", async () => {
    mockedExecSync.mockImplementation((cmd: any) => {
      const command = typeof cmd === "string" ? cmd : cmd.toString();
      if (command === "npm install -g primitiv") {
        throw new Error("EACCES: permission denied");
      }
      return Buffer.from("");
    });

    await runInstall("/tmp/test-project");

    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("Permission denied")
    );
    expect(p.cancel).toHaveBeenCalledWith("Installation aborted.");
    expect(mockedRunInit).not.toHaveBeenCalled();
  });

  it("shows generic error on other install failures", async () => {
    mockedExecSync.mockImplementation((cmd: any) => {
      const command = typeof cmd === "string" ? cmd : cmd.toString();
      if (command === "npm install -g primitiv") {
        throw new Error("ENETWORK: something went wrong");
      }
      return Buffer.from("");
    });

    await runInstall("/tmp/test-project");

    expect(p.log.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to install globally")
    );
    expect(p.cancel).toHaveBeenCalledWith("Installation aborted.");
  });

  it("warns when already initialized", async () => {
    mockedIsPrimitivInitialized.mockReturnValue(true);

    await runInstall("/tmp/test-project");

    expect(p.log.warn).toHaveBeenCalledWith(
      "Primitiv is already initialized in this directory."
    );
    expect(p.log.info).toHaveBeenCalledWith(
      "Run 'primitiv update' to update to the latest version."
    );
    expect(mockedExecSync).not.toHaveBeenCalledWith(
      "npm install -g primitiv",
      expect.anything()
    );
    expect(mockedRunInit).not.toHaveBeenCalled();
  });

  it("prompts to init git when not a git repo", async () => {
    const { GitNotFoundError } = await import("../src/utils/errors.js");
    mockedAssertGitRepo.mockImplementation(() => {
      throw new GitNotFoundError();
    });
    vi.mocked(p.confirm).mockResolvedValue(true);

    await runInstall("/tmp/test-project");

    expect(p.confirm).toHaveBeenCalledWith({
      message: "No git repo found. Initialize one?",
    });
    expect(mockedExecSync).toHaveBeenCalledWith("git init", {
      cwd: "/tmp/test-project",
      stdio: "pipe",
    });
    expect(p.log.success).toHaveBeenCalledWith("Git repository initialized");
  });

  it("cancels when user declines git init", async () => {
    const { GitNotFoundError } = await import("../src/utils/errors.js");
    mockedAssertGitRepo.mockImplementation(() => {
      throw new GitNotFoundError();
    });
    vi.mocked(p.confirm).mockResolvedValue(false);

    await runInstall("/tmp/test-project");

    expect(p.cancel).toHaveBeenCalledWith(
      "Primitiv requires a git repository."
    );
    expect(mockedRunInit).not.toHaveBeenCalled();
  });
});
