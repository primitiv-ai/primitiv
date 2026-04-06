import * as p from "@clack/prompts";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { renderCompactBanner } from "../ui/banner.js";
import { renderBox } from "../ui/box.js";
import { loadTemplate, getCommandTemplateNames } from "../init/templates.js";
import { installSlashCommands } from "../init/installCommands.js";
import { installGitNexusMcp } from "../init/installGitNexus.js";
import { assertGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { NotInitializedError } from "../utils/errors.js";

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

export async function runUpdate(targetDir: string): Promise<void> {
  console.log(renderCompactBanner());

  assertGitRepo(targetDir);

  if (!isPrimitivInitialized(targetDir)) {
    throw new NotInitializedError();
  }

  // Detect changes before overwriting
  const diff = detectChanges(targetDir);

  // Install all commands (always overwrites)
  installSlashCommands(targetDir);
  installGitNexusMcp(targetDir);

  // Build summary
  const lines: string[] = [];

  if (diff.updated.length > 0) {
    lines.push(`Updated: ${diff.updated.join(", ")}`);
  }
  if (diff.added.length > 0) {
    lines.push(`Added: ${diff.added.join(", ")}`);
  }

  if (diff.updated.length === 0 && diff.added.length === 0) {
    lines.push("All commands up to date");
  }

  lines.push("");
  lines.push(
    `${diff.updated.length} updated, ${diff.added.length} added, ${diff.unchanged.length} unchanged`,
  );

  const summary = lines.join("\n");

  console.log(renderBox({ title: "Update Summary", content: summary }));
  p.log.success("GitNexus MCP configuration verified");
}
