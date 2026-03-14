import { assertGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { initGreenfield } from "../init/greenfield.js";
import { initBrownfield } from "../init/brownfield.js";
import chalk from "chalk";

export interface InitOptions {
  greenfield?: boolean;
  brownfield?: boolean;
}

export async function runInit(targetDir: string, options: InitOptions): Promise<void> {
  // Verify git repo
  assertGitRepo(targetDir);

  // Check if already initialized
  if (isPrimitivInitialized(targetDir)) {
    console.log(chalk.yellow("Primitiv is already initialized in this directory."));
    return;
  }

  const isBrownfield = options.brownfield ?? !options.greenfield;

  if (isBrownfield) {
    console.log(chalk.blue("Initializing Primitiv (brownfield mode)..."));
    const result = initBrownfield(targetDir);
    console.log(chalk.green("✓ Created .primitiv/ directory structure"));
    console.log(chalk.green(`✓ Installed ${result.commands.length} slash commands`));
    console.log(chalk.green("✓ Configured GitNexus MCP server"));

    if (result.detectedStack.languages.length > 0) {
      console.log(chalk.blue("\nDetected stack:"));
      console.log(`  Languages: ${result.detectedStack.languages.join(", ")}`);
      if (result.detectedStack.frameworks.length > 0) {
        console.log(`  Frameworks: ${result.detectedStack.frameworks.join(", ")}`);
      }
      if (result.detectedStack.databases.length > 0) {
        console.log(`  Databases: ${result.detectedStack.databases.join(", ")}`);
      }
    }
  } else {
    console.log(chalk.blue("Initializing Primitiv (greenfield mode)..."));
    const result = initGreenfield(targetDir);
    console.log(chalk.green("✓ Created .primitiv/ directory structure"));
    console.log(chalk.green(`✓ Installed ${result.commands.length} slash commands`));
    console.log(chalk.green("✓ Configured GitNexus MCP server"));
  }

  console.log(chalk.blue("\nNext steps:"));
  console.log("  1. /primitiv.gate-1 generate <company description>");
  console.log("  2. /primitiv.gate-2 generate <security requirements>");
  console.log("  3. /primitiv.constitution product generate <product description>");
  console.log("  4. /primitiv.specify <feature description>");
}
