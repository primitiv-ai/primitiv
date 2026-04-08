import * as p from "@clack/prompts";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { isGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { initGreenfield } from "../init/greenfield.js";
import { initBrownfield } from "../init/brownfield.js";
import { renderBanner } from "../ui/banner.js";
import { renderBox } from "../ui/box.js";

export interface InitOptions {
  greenfield?: boolean;
  brownfield?: boolean;
  yes?: boolean;
}

const NEXT_STEPS = [
  "1. /primitiv.company-principles generate <company description>",
  "2. /primitiv.security-principles generate <security requirements>",
  "3. /primitiv.constitution product generate <product description>",
  "4. /primitiv.specify <feature description>",
].join("\n");

async function runInteractive(targetDir: string): Promise<void> {
  // 1. Print banner
  const banner = await renderBanner();
  console.log(banner);

  p.intro("Initializing Primitiv");

  // 2. Check git repo
  if (!isGitRepo(targetDir)) {
    const shouldInit = await p.confirm({
      message: "No git repo found. Initialize one?",
    });

    if (p.isCancel(shouldInit) || !shouldInit) {
      p.cancel("Cannot proceed without a git repository.");
      return;
    }

    execSync("git init", { cwd: targetDir, stdio: "pipe" });
    p.log.success("Initialized git repository.");
  }

  // 3. Check if already initialized
  if (isPrimitivInitialized(targetDir)) {
    p.log.warn(
      "Primitiv is already initialized in this directory. Use `primitiv update` to refresh commands."
    );
    return;
  }

  // 4. Mode selection
  const mode = await p.select({
    message: "What kind of project is this?",
    options: [
      { value: "greenfield" as const, label: "New project (greenfield)" },
      { value: "brownfield" as const, label: "Existing project (brownfield)" },
    ],
  });

  if (p.isCancel(mode)) {
    p.cancel("Init cancelled.");
    return;
  }

  await runWithSpinner(targetDir, mode);
}

async function runWithFlag(
  targetDir: string,
  mode: "greenfield" | "brownfield"
): Promise<void> {
  // Print banner
  const banner = await renderBanner();
  console.log(banner);

  p.intro("Initializing Primitiv");

  // Check git repo
  if (!isGitRepo(targetDir)) {
    const shouldInit = await p.confirm({
      message: "No git repo found. Initialize one?",
    });

    if (p.isCancel(shouldInit) || !shouldInit) {
      p.cancel("Cannot proceed without a git repository.");
      return;
    }

    execSync("git init", { cwd: targetDir, stdio: "pipe" });
    p.log.success("Initialized git repository.");
  }

  // Check if already initialized
  if (isPrimitivInitialized(targetDir)) {
    p.log.warn(
      "Primitiv is already initialized in this directory. Use `primitiv update` to refresh commands."
    );
    return;
  }

  await runWithSpinner(targetDir, mode);
}

async function runWithSpinner(
  targetDir: string,
  mode: "greenfield" | "brownfield"
): Promise<void> {
  const s = p.spinner();

  if (mode === "brownfield") {
    s.start("Analyzing existing project...");
    const result = initBrownfield(targetDir);
    s.stop("Project analyzed and initialized.");

    if (result.detectedStack.languages.length > 0) {
      p.log.info(
        [
          chalk.bold("Detected stack:"),
          `  Languages:  ${result.detectedStack.languages.join(", ")}`,
          result.detectedStack.frameworks.length > 0
            ? `  Frameworks: ${result.detectedStack.frameworks.join(", ")}`
            : null,
          result.detectedStack.databases.length > 0
            ? `  Databases:  ${result.detectedStack.databases.join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      );
    }

    p.log.success(`Installed ${result.commands.length} slash commands.`);
  } else {
    s.start("Setting up new project...");
    const result = initGreenfield(targetDir);
    s.stop("Project initialized.");

    p.log.success(`Installed ${result.commands.length} slash commands.`);
  }

  // Success box with next steps
  console.log();
  console.log(
    renderBox({
      title: "Next steps",
      content: NEXT_STEPS,
    })
  );

  p.outro("Done!");
}

async function runNonInteractive(targetDir: string): Promise<void> {
  // No banner, no prompts — CI-friendly
  if (!isGitRepo(targetDir)) {
    console.error(chalk.red("Error: Not a git repository. Run 'git init' first."));
    process.exitCode = 1;
    return;
  }

  if (isPrimitivInitialized(targetDir)) {
    console.log(chalk.yellow("Primitiv is already initialized in this directory."));
    return;
  }

  // Default to brownfield
  console.log(chalk.blue("Initializing Primitiv (brownfield mode)..."));
  const result = initBrownfield(targetDir);
  console.log(chalk.green(`\u2713 Created .primitiv/ directory structure`));
  console.log(chalk.green(`\u2713 Installed ${result.commands.length} slash commands`));
  console.log(chalk.green(`\u2713 Configured GitNexus MCP server`));

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

  console.log(chalk.blue("\nNext steps:"));
  console.log("  1. /primitiv.company-principles generate <company description>");
  console.log("  2. /primitiv.security-principles generate <security requirements>");
  console.log("  3. /primitiv.constitution product generate <product description>");
  console.log("  4. /primitiv.specify <feature description>");
}

export async function runInit(
  targetDir: string,
  options: InitOptions
): Promise<void> {
  // Non-interactive mode (--yes)
  if (options.yes) {
    return runNonInteractive(targetDir);
  }

  // Flag mode (--greenfield or --brownfield)
  if (options.greenfield || options.brownfield) {
    const mode = options.greenfield ? "greenfield" : "brownfield";
    return runWithFlag(targetDir, mode);
  }

  // Interactive mode (default)
  return runInteractive(targetDir);
}
