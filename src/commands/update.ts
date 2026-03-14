import { assertGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { installSlashCommands } from "../init/installCommands.js";
import { installGitNexusMcp } from "../init/installGitNexus.js";
import { NotInitializedError } from "../utils/errors.js";
import chalk from "chalk";

export async function runUpdate(targetDir: string): Promise<void> {
  assertGitRepo(targetDir);

  if (!isPrimitivInitialized(targetDir)) {
    throw new NotInitializedError();
  }

  const commands = installSlashCommands(targetDir);
  installGitNexusMcp(targetDir);

  console.log(chalk.green(`✓ Updated ${commands.length} slash commands`));
  console.log(chalk.green("✓ GitNexus MCP configuration verified"));
  console.log(chalk.gray("\n  All .primitiv/ data preserved (gates, constitutions, specs)."));
}
