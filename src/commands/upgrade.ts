import * as p from "@clack/prompts";
import { readFileSync, existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderCompactBanner } from "../ui/banner.js";
import { renderBox } from "../ui/box.js";
import { loadTemplate, getCommandTemplateNames } from "../init/templates.js";
import { installSlashCommands } from "../init/installCommands.js";
import { installGitNexusMcp } from "../init/installGitNexus.js";
import { assertGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized, ensurePrimitivDir } from "../utils/fileSystem.js";
import { NotInitializedError } from "../utils/errors.js";
import { loadState, saveState } from "../utils/ids.js";
import { getPackageVersion } from "../utils/version.js";

interface CommandDiff {
  updated: string[];
  added: string[];
  unchanged: string[];
}

function detectChanges(projectRoot: string): CommandDiff {
  const commandsDir = join(projectRoot, ".claude", "commands");
  const result: CommandDiff = { updated: [], added: [], unchanged: [] };

  for (const name of getCommandTemplateNames()) {
    const templateContent = loadTemplate("commands", name);
    const installedPath = join(commandsDir, name);

    if (!existsSync(installedPath)) {
      result.added.push(name);
    } else {
      const installedContent = readFileSync(installedPath, "utf-8");
      if (installedContent === templateContent) {
        result.unchanged.push(name);
      } else {
        result.updated.push(name);
      }
    }
  }

  return result;
}

export async function runUpgrade(targetDir: string): Promise<void> {
  console.log(renderCompactBanner());

  assertGitRepo(targetDir);

  if (!isPrimitivInitialized(targetDir)) {
    throw new NotInitializedError();
  }

  const currentVersion = getPackageVersion();
  const state = loadState(targetDir);
  const previousVersion = state.primitivVersion ?? null;

  // Version transition reporting
  if (previousVersion && previousVersion === currentVersion) {
    p.log.info(`Already up to date (v${currentVersion})`);
  } else if (previousVersion) {
    p.log.info(`Upgrading from ${previousVersion} → ${currentVersion}`);
  } else {
    p.log.info(`Upgrading to v${currentVersion}`);
  }

  // 1. Sync directory structure (creates any missing dirs)
  ensurePrimitivDir(targetDir);

  // 2. Migrate state file — add missing fields with defaults
  if (state.nextLearningId === undefined) {
    state.nextLearningId = 1;
  }
  state.primitivVersion = currentVersion;

  // 3. Detect command changes before overwriting
  const diff = detectChanges(targetDir);

  // 4. Install all commands (always overwrites)
  installSlashCommands(targetDir);
  installGitNexusMcp(targetDir);

  // 4b. Remove deprecated commands
  const DEPRECATED_COMMANDS = ["primitiv.gate-1.md", "primitiv.gate-2.md"];
  const commandsDir = join(targetDir, ".claude", "commands");
  const removed: string[] = [];
  for (const name of DEPRECATED_COMMANDS) {
    const filePath = join(commandsDir, name);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      removed.push(name);
    }
  }

  // 4c. Regenerate .primitiv/README.md from template
  const primitivReadmePath = join(targetDir, ".primitiv", "README.md");
  const readmeTemplate = loadTemplate("specs", "README.md");
  writeFileSync(primitivReadmePath, readmeTemplate);

  // 5. Save migrated state
  saveState(targetDir, state);

  // 6. Build summary
  const lines: string[] = [];

  if (diff.updated.length > 0) {
    lines.push(`Updated: ${diff.updated.join(", ")}`);
  }
  if (diff.added.length > 0) {
    lines.push(`Added: ${diff.added.join(", ")}`);
  }

  if (removed.length > 0) {
    lines.push(`Removed: ${removed.join(", ")}`);
  }

  if (diff.updated.length === 0 && diff.added.length === 0 && removed.length === 0) {
    lines.push("All commands up to date");
  }

  lines.push("");
  lines.push(
    `${diff.updated.length} updated, ${diff.added.length} added, ${removed.length} removed, ${diff.unchanged.length} unchanged`,
  );

  const summary = lines.join("\n");
  console.log(renderBox({ title: "Upgrade Summary", content: summary }));
  p.log.success("GitNexus MCP configuration verified");
}
