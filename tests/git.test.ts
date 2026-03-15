import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { detectDefaultBranch } from "../src/git/branching.js";

function createTempGitRepo(defaultBranch = "main"): string {
  const root = mkdtempSync(join(tmpdir(), "primitiv-git-"));
  execSync(`git init -b ${defaultBranch}`, { cwd: root, stdio: "pipe" });
  execSync("git config user.email test@test.com", { cwd: root, stdio: "pipe" });
  execSync("git config user.name Test", { cwd: root, stdio: "pipe" });
  writeFileSync(join(root, "README.md"), "# Test");
  execSync("git add . && git commit -m init", { cwd: root, stdio: "pipe" });
  return root;
}

describe("detectDefaultBranch", () => {
  it("detects main as default branch", () => {
    const root = createTempGitRepo("main");
    expect(detectDefaultBranch(root)).toBe("main");
  });

  it("detects master as default branch", () => {
    const root = createTempGitRepo("master");
    expect(detectDefaultBranch(root)).toBe("master");
  });

  it("throws when neither main nor master exists", () => {
    const root = createTempGitRepo("develop");
    expect(() => detectDefaultBranch(root)).toThrow();
  });

  it("still works when on a different branch", () => {
    const root = createTempGitRepo("main");
    execSync("git checkout -b feature/test", { cwd: root, stdio: "pipe" });
    expect(detectDefaultBranch(root)).toBe("main");
  });
});
