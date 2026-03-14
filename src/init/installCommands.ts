import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadTemplate, getCommandTemplateNames } from "./templates.js";

export function installSlashCommands(projectRoot: string): string[] {
  const commandsDir = join(projectRoot, ".claude", "commands");
  if (!existsSync(commandsDir)) {
    mkdirSync(commandsDir, { recursive: true });
  }

  const installed: string[] = [];
  for (const name of getCommandTemplateNames()) {
    const content = loadTemplate("commands", name);
    const destPath = join(commandsDir, name);
    writeFileSync(destPath, content);
    installed.push(name);
  }

  return installed;
}
