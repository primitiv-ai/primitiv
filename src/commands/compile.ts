import chalk from "chalk";
import { resolve } from "node:path";
import { GovernanceCompiler } from "../engine/GovernanceCompiler.js";
import type { GovernanceContext } from "../schemas/governance.js";

const SECTIONS = [
  { key: "company" as const, label: "company    " },
  { key: "security" as const, label: "security   " },
  { key: "product" as const, label: "product    " },
  { key: "development" as const, label: "development" },
  { key: "architecture" as const, label: "architecture" },
] satisfies Array<{ key: keyof Omit<GovernanceContext, "version" | "compiledAt" | "sourceHash" | "warnings">; label: string }>;

export async function runCompile(projectRoot: string): Promise<void> {
  const dir = resolve(projectRoot);
  const compiler = new GovernanceCompiler(dir);

  console.log(chalk.bold("Compiling governance context...\n"));

  const context = compiler.compile();

  for (const { key, label } of SECTIONS) {
    const present = context[key] !== null;
    const icon = present ? chalk.green("✓") : chalk.yellow("⚠");
    const status = present
      ? chalk.dim("found")
      : chalk.yellow("not found");
    console.log(`  ${icon} ${label}  ${status}`);
  }

  if (context.warnings.length > 0) {
    console.log();
    for (const warning of context.warnings) {
      console.log(chalk.yellow(`  ⚠ ${warning.message}`));
    }
  }

  compiler.write(context);

  console.log(chalk.green("\n✓ Governance context compiled"));
  console.log(chalk.dim(`  Hash:     ${context.sourceHash.slice(0, 8)}...`));
  console.log(chalk.dim(`  File:     .primitiv/governance-context.json (gitignored)`));
  console.log(chalk.dim(`  Warnings: ${context.warnings.length === 0 ? "none" : String(context.warnings.length)}`));
}
