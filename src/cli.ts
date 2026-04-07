import { Command } from "commander";
import { resolve } from "node:path";
import { runInit } from "./commands/init.js";
import { runInstall } from "./commands/install.js";
import { runValidate } from "./commands/validate.js";
import { runStatus } from "./commands/status.js";
import { runUpdate } from "./commands/update.js";
import { runMigrate } from "./commands/migrate.js";
import { runCompile } from "./commands/compile.js";
import { runLearnAdd, runLearnList, runLearnSearch, runLearnRemove } from "./commands/learn.js";

export function createCli(): Command {
  const program = new Command();

  program
    .name("primitiv")
    .description("Spec Driven Development engine for AI-assisted software development")
    .version("0.2.0");

  program
    .command("init")
    .description("Initialize Primitiv in the current directory")
    .argument("[dir]", "Target directory", ".")
    .option("--greenfield", "Initialize as a new project")
    .option("--brownfield", "Initialize with existing codebase analysis")
    .option("--yes", "Non-interactive mode (skip prompts, use defaults)")
    .action(async (dir: string, options: { greenfield?: boolean; brownfield?: boolean; yes?: boolean }) => {
      const targetDir = resolve(dir);
      await runInit(targetDir, options);
    });

  program
    .command("install")
    .description("Install primitiv globally and initialize the current project")
    .action(async () => {
      const targetDir = resolve(".");
      await runInstall(targetDir);
    });

  program
    .command("validate")
    .description("Validate a spec against gates")
    .argument("<spec-id>", "Spec ID (e.g., SPEC-001)")
    .option("--gate <number>", "Validate specific gate (1, 2, or 3)")
    .action(async (specId: string, options: { gate?: string }) => {
      await runValidate(resolve("."), specId, options);
    });

  program
    .command("status")
    .description("Show pipeline state")
    .argument("[spec-id]", "Spec ID for detailed view")
    .option("--filter <status>", "Filter specs by status (e.g., planned, in-progress)")
    .option("--output <path>", "Write markdown report to file")
    .action(async (specId?: string, options?: { filter?: string; output?: string }) => {
      await runStatus(resolve("."), specId, options);
    });

  program
    .command("update")
    .description("Update slash commands and MCP config (preserves all data)")
    .argument("[dir]", "Target directory", ".")
    .action(async (dir: string) => {
      const targetDir = resolve(dir);
      await runUpdate(targetDir);
    });

  program
    .command("compile")
    .description("Compile governance files into a structured context")
    .action(async () => {
      await runCompile(resolve("."));
    });

  const learn = program
    .command("learn")
    .description("Manage project learnings");

  learn
    .command("add")
    .description("Record a new learning")
    .requiredOption("--type <type>", "best-practice | error-resolution | convention")
    .requiredOption("--title <title>", "Learning title")
    .option("--description <desc>", "Detailed description")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--severity <level>", "info | important | critical", "info")
    .option("--spec <specId>", "Link to originating spec")
    .option("--source <source>", "user | gate-failure | test-failure | clarification | review", "user")
    .action(async (options: { type: string; title: string; description?: string; tags?: string; severity?: string; spec?: string; source?: string }) => {
      await runLearnAdd(resolve("."), options);
    });

  learn
    .command("list")
    .description("List all learnings")
    .option("--type <type>", "Filter by type")
    .option("--tag <tag>", "Filter by tag")
    .action(async (options: { type?: string; tag?: string }) => {
      await runLearnList(resolve("."), options);
    });

  learn
    .command("search")
    .description("Search learnings by keyword")
    .argument("<query>", "Search keyword")
    .action(async (query: string) => {
      await runLearnSearch(resolve("."), query);
    });

  learn
    .command("remove")
    .description("Remove a learning by ID")
    .argument("<id>", "Learning ID (e.g., LEARN-001)")
    .action(async (id: string) => {
      await runLearnRemove(resolve("."), id);
    });

  const migrate = program
    .command("migrate")
    .description("Migrate from another spec-driven development tool");

  migrate
    .command("speckit")
    .description("Migrate from GitHub SpecKit to Primitiv")
    .action(async () => {
      await runMigrate(resolve("."));
    });

  return program;
}
