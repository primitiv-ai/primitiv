import { execSync } from "node:child_process";
import { getCurrentBranch } from "./gitGuard.js";
import { GitNotFoundError } from "../utils/errors.js";

export function createSpecBranch(cwd: string, specId: string, slug: string): string {
  const branchName = `spec/${specId}-${slug}`;
  execSync(`git checkout -b "${branchName}"`, { cwd, stdio: "pipe" });
  return branchName;
}

export function checkoutBranch(cwd: string, branchName: string): void {
  execSync(`git checkout "${branchName}"`, { cwd, stdio: "pipe" });
}

export function branchExists(cwd: string, branchName: string): boolean {
  try {
    execSync(`git rev-parse --verify "${branchName}"`, { cwd, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function isOnSpecBranch(cwd: string): boolean {
  const branch = getCurrentBranch(cwd);
  return branch.startsWith("spec/");
}

export function getSpecIdFromBranch(cwd: string): string | null {
  const branch = getCurrentBranch(cwd);
  const match = branch.match(/^spec\/(SPEC-\d+)/);
  return match ? match[1] : null;
}

export function detectDefaultBranch(cwd: string): string {
  // Try origin/HEAD first
  try {
    const ref = execSync("git symbolic-ref refs/remotes/origin/HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    // refs/remotes/origin/main → main
    const parts = ref.split("/");
    return parts[parts.length - 1];
  } catch {
    // No remote or origin/HEAD not set
  }

  // Check if local main exists
  if (branchExists(cwd, "main")) return "main";

  // Check if local master exists
  if (branchExists(cwd, "master")) return "master";

  throw new GitNotFoundError();
}
