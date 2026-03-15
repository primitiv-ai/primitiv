import { Command } from "commander";
import { resolve } from "node:path";
import { runInit } from "./commands/init.js";
import { runValidate } from "./commands/validate.js";
import { runStatus } from "./commands/status.js";
import { runUpdate } from "./commands/update.js";

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
    .action(async (dir: string, options: { greenfield?: boolean; brownfield?: boolean }) => {
      const targetDir = resolve(dir);
      await runInit(targetDir, options);
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

  return program;
}
