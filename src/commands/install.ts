import { execSync } from "node:child_process";
import * as p from "@clack/prompts";
import { assertGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { GitNotFoundError } from "../utils/errors.js";
import { runInit } from "./init.js";

export async function runInstall(targetDir: string): Promise<void> {
  p.intro("primitiv install");

  // Step 1: Check git repo
  try {
    assertGitRepo(targetDir);
  } catch (error: unknown) {
    if (error instanceof GitNotFoundError) {
      const shouldInit = await p.confirm({
        message: "No git repo found. Initialize one?",
      });

      if (p.isCancel(shouldInit) || !shouldInit) {
        p.cancel("Primitiv requires a git repository.");
        return;
      }

      execSync("git init", { cwd: targetDir, stdio: "pipe" });
      p.log.success("Git repository initialized");
    } else {
      throw error;
    }
  }

  // Step 2: Check if already initialized
  if (isPrimitivInitialized(targetDir)) {
    p.log.warn("Primitiv is already initialized in this directory.");
    p.log.info("Run 'primitiv update' to update to the latest version.");
    return;
  }

  // Step 3: Global install with spinner
  const s = p.spinner();
  s.start("Installing primitiv globally...");
  try {
    execSync("npm install -g primitiv", { stdio: "pipe" });
    s.stop("primitiv installed globally");
  } catch (error: unknown) {
    s.stop("Global install failed");
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("EACCES") || msg.includes("permission")) {
      p.log.error("Permission denied. Try: sudo npx primitiv install");
    } else {
      p.log.error(`Failed to install globally: ${msg}`);
    }
    p.cancel("Installation aborted.");
    return;
  }

  // Step 4: Delegate to init wizard
  await runInit(targetDir, {});

  // Step 5: Final outro
  p.outro("primitiv is ready. Run 'primitiv --help' to see all commands.");
}
