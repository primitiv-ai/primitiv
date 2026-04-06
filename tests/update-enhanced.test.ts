import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

// Mock templates module so we don't depend on filesystem path resolution
const FAKE_TEMPLATES: Record<string, string> = {
  "cmd-a.md": "template-content-a",
  "cmd-b.md": "template-content-b",
  "cmd-c.md": "template-content-c",
};

vi.mock("../src/init/templates.js", () => ({
  loadTemplate: (_category: string, name: string) => {
    const content = FAKE_TEMPLATES[name];
    if (!content) throw new Error(`Unknown template: ${name}`);
    return content;
  },
  getCommandTemplateNames: () => Object.keys(FAKE_TEMPLATES),
}));

// Mock installSlashCommands — it writes files, but we just track that it was called
vi.mock("../src/init/installCommands.js", () => ({
  installSlashCommands: vi.fn(() => Object.keys(FAKE_TEMPLATES)),
}));

// Mock installGitNexusMcp
vi.mock("../src/init/installGitNexus.js", () => ({
  installGitNexusMcp: vi.fn(),
}));

// Import after mocks are set up
const { runUpdate } = await import("../src/commands/update.js");

function initGitRepo(dir: string): void {
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync("git config user.email test@test.com", { cwd: dir, stdio: "pipe" });
  execSync("git config user.name Test", { cwd: dir, stdio: "pipe" });
}

describe("runUpdate — enhanced diff detection", () => {
  let testDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "primitiv-"));
    initGitRepo(testDir);
    // Create .primitiv dir so isPrimitivInitialized returns true
    mkdirSync(join(testDir, ".primitiv"), { recursive: true });
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    rmSync(testDir, { recursive: true, force: true });
  });

  it("reports updated commands when installed content differs from template", async () => {
    const commandsDir = join(testDir, ".claude", "commands");
    mkdirSync(commandsDir, { recursive: true });

    // Write old content for first two commands — they'll be "updated"
    writeFileSync(join(commandsDir, "cmd-a.md"), "old content v1");
    writeFileSync(join(commandsDir, "cmd-b.md"), "old content v2");
    // cmd-c.md doesn't exist — it'll be "added"

    await runUpdate(testDir);

    const output = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(output).toContain("Updated:");
    expect(output).toContain("cmd-a.md");
    expect(output).toContain("cmd-b.md");
    expect(output).toContain("Added:");
    expect(output).toContain("cmd-c.md");
    expect(output).toContain("2 updated, 1 added, 0 unchanged");
  });

  it("reports all commands up to date when content matches templates", async () => {
    const commandsDir = join(testDir, ".claude", "commands");
    mkdirSync(commandsDir, { recursive: true });

    // Write exact template content for every command
    for (const [name, content] of Object.entries(FAKE_TEMPLATES)) {
      writeFileSync(join(commandsDir, name), content);
    }

    await runUpdate(testDir);

    const output = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(output).toContain("All commands up to date");
    expect(output).toContain("0 updated, 0 added, 3 unchanged");
  });

  it("reports added commands when commands directory does not exist", async () => {
    // No .claude/commands dir at all — all commands are "added"
    await runUpdate(testDir);

    const output = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(output).toContain("Added:");
    expect(output).toContain("0 updated, 3 added, 0 unchanged");
    expect(output).not.toContain("Updated:");
  });

  it("shows compact banner in output", async () => {
    await runUpdate(testDir);

    const firstCall = String(logSpy.mock.calls[0]?.[0] ?? "");
    expect(firstCall).toContain("Primitiv");
  });
});
