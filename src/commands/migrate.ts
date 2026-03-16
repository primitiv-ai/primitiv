import chalk from "chalk";
import Table from "cli-table3";
import { assertGitRepo } from "../git/gitGuard.js";
import { MigrationManager } from "../engine/MigrationManager.js";
import { MigrationNotFoundError } from "../utils/errors.js";

export async function runMigrate(targetDir: string): Promise<void> {
  assertGitRepo(targetDir);

  const manager = new MigrationManager(targetDir);

  // Detection phase
  console.log(chalk.blue("\nDetecting SpecKit project..."));
  const detection = manager.detectSpecKit();
  if (!detection.found) {
    throw new MigrationNotFoundError();
  }

  if (detection.specifyDir) {
    console.log(chalk.green("  ✓ Found .specify/ directory"));
  }
  if (detection.specsDir) {
    const specDirs = manager.discoverSpecKitSpecs(detection.specsDir);
    console.log(chalk.green(`  ✓ Found specs/ directory with ${specDirs.length} specs`));
  }
  if (detection.claudeMdPath) {
    console.log(chalk.green("  ✓ Found CLAUDE.md"));
  }

  // Run migration
  console.log(chalk.blue("\nMigrating..."));
  const report = manager.migrate();

  // Constitutions
  if (report.constitutionsMigrated.length > 0) {
    console.log(chalk.blue("\nConstitutions:"));
    for (const c of report.constitutionsMigrated) {
      console.log(chalk.green(`  ✓ ${c} constitution → .primitiv/constitutions/${c}.md`));
    }
  }
  for (const c of report.constitutionsSkipped) {
    console.log(chalk.yellow(`  ⊘ ${c} constitution — already exists, skipped`));
  }

  // Architecture
  if (report.architectureMigrated) {
    console.log(chalk.green("  ✓ CLAUDE.md → .primitiv/constitutions/architecture.md"));
  }

  // Specs
  if (report.specsMigrated.length > 0) {
    console.log(chalk.blue("\nSpecs migrated:"));
    for (const m of report.specsMigrated) {
      console.log(chalk.green(`  ✓ ${m.primitivId} ← ${m.original}`));
    }
  }
  for (const s of report.specsSkipped) {
    console.log(chalk.yellow(`  ⊘ ${s} — already migrated, skipped`));
  }

  // Mapping table
  if (report.specsMigrated.length > 0) {
    console.log(chalk.blue("\nSpec ID Mapping:"));
    const table = new Table({
      head: [chalk.white("Primitiv"), chalk.white("Original (SpecKit)")],
    });
    for (const m of report.specsMigrated) {
      table.push([m.primitivId, m.original]);
    }
    console.log(table.toString());
  }

  // Summary
  const totalMigrated = report.specsMigrated.length;
  const totalSkipped = report.specsSkipped.length;
  const constMigrated = report.constitutionsMigrated.length;
  const archStr = report.architectureMigrated ? "1 architecture" : "";

  const parts = [
    `${totalMigrated} spec${totalMigrated !== 1 ? "s" : ""} migrated`,
    totalSkipped > 0 ? `${totalSkipped} skipped` : "",
    constMigrated > 0 ? `${constMigrated} constitution${constMigrated !== 1 ? "s" : ""}` : "",
    archStr,
  ].filter(Boolean);

  console.log(chalk.green(`\nSummary: ${parts.join(", ")}`));

  // Warnings
  if (report.warnings.length > 0) {
    console.log(chalk.yellow("\n⚠ Manual steps remaining:"));
    for (const w of report.warnings) {
      console.log(chalk.yellow(`  - ${w}`));
    }
  }

  // Errors
  if (report.errors.length > 0) {
    console.log(chalk.red("\n✗ Errors:"));
    for (const e of report.errors) {
      console.log(chalk.red(`  - ${e}`));
    }
  }
}
