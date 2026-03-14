import { execSync } from "node:child_process";
import { GitNotFoundError } from "../utils/errors.js";

export function assertGitRepo(cwd: string): void {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      stdio: "pipe",
    });
  } catch {
    throw new GitNotFoundError();
  }
}

export function isGitRepo(cwd: string): boolean {
  try {
    assertGitRepo(cwd);
    return true;
  } catch {
    return false;
  }
}

export function getGitRoot(cwd: string): string {
  return execSync("git rev-parse --show-toplevel", {
    cwd,
    encoding: "utf-8",
  }).trim();
}

export function getCurrentBranch(cwd: string): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    cwd,
    encoding: "utf-8",
  }).trim();
}

export function getGitUser(cwd: string): string {
  try {
    return execSync("git config user.name", {
      cwd,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}
