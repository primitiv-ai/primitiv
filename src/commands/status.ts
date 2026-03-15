import { writeFileSync } from "node:fs";
import { PrimitivEngine } from "../engine/PrimitivEngine.js";
import { SPEC_STATUSES } from "../schemas/common.js";
import type { SpecStatus } from "../schemas/common.js";
import Table from "cli-table3";
import chalk from "chalk";

export async function runStatus(
  targetDir: string,
  specId?: string,
  options?: { filter?: string; output?: string },
): Promise<void> {
  const engine = PrimitivEngine.load(targetDir);

  if (specId) {
    const graph = engine.getSpecGraph(specId);
    const spec = graph.spec.data;
    console.log(chalk.bold(`\nSpec: ${spec.id} — ${spec.title}\n`));
    console.log(`  Status:   ${formatStatus(spec.status)}`);
    console.log(`  Branch:   ${spec.branch ?? "N/A"}`);
    console.log(`  Author:   ${spec.author ?? "N/A"}`);
    console.log(`  Created:  ${spec.createdAt ?? "N/A"}`);
    console.log(`  Updated:  ${spec.updatedAt ?? "N/A"}`);
    console.log(`  Plan:     ${graph.plan ? "✓" : "—"}`);
    console.log(`  Tasks:    ${graph.tasks ? `✓ (${graph.tasks.data.tasks.length} tasks)` : "—"}`);
    console.log(`  Clarify:  ${graph.clarifications ? "✓" : "—"}`);
    if (graph.testResults) {
      const s = graph.testResults.data.summary;
      console.log(`  Tests:    ✓ (${s.passed}/${s.total} passed, ${s.failed} failed, ${s.skipped} skipped)`);
    } else {
      console.log(`  Tests:    —`);
    }
    return;
  }

  // Validate --filter value
  let statusFilter: SpecStatus | undefined;
  if (options?.filter) {
    if (!SPEC_STATUSES.includes(options.filter as SpecStatus)) {
      console.error(
        chalk.red(`Invalid filter: "${options.filter}". Valid statuses: ${SPEC_STATUSES.join(", ")}`),
      );
      process.exitCode = 1;
      return;
    }
    statusFilter = options.filter as SpecStatus;
  }

  const specs = engine.listSpecs(statusFilter ? { status: statusFilter } : undefined);
  if (specs.length === 0) {
    const msg = statusFilter
      ? `No specs with status "${statusFilter}".`
      : "No specs found. Create one with /primitiv.specify";
    console.log(chalk.yellow(`\n${msg}`));
    return;
  }

  const table = new Table({
    head: ["ID", "Title", "Status", "Branch"],
    style: { head: ["cyan"] },
  });

  for (const spec of specs) {
    table.push([
      spec.data.id,
      spec.data.title,
      formatStatus(spec.data.status),
      spec.data.branch ?? "—",
    ]);
  }

  console.log(chalk.bold("\nPrimitiv Specs\n"));
  console.log(table.toString());

  // Write markdown report if --output specified
  if (options?.output) {
    const timestamp = new Date().toISOString();
    const filterNote = statusFilter ? ` (filtered: ${statusFilter})` : "";
    let md = `# Pipeline Status Report${filterNote}\n\n`;
    md += `**Generated**: ${timestamp}\n`;
    md += `**Specs**: ${specs.length}\n\n`;
    md += `| ID | Title | Status | Branch | Author | Updated |\n`;
    md += `|----|-------|--------|--------|--------|---------|\n`;
    for (const spec of specs) {
      const d = spec.data;
      md += `| ${d.id} | ${d.title} | ${d.status} | ${d.branch ?? "—"} | ${d.author ?? "—"} | ${d.updatedAt ?? "—"} |\n`;
    }
    writeFileSync(options.output, md);
    console.log(chalk.green(`\n✓ Report written to ${options.output}`));
  }
}

function formatStatus(status: string): string {
  const colors: Record<string, (s: string) => string> = {
    "draft": chalk.gray,
    "gate-1-passed": chalk.blue,
    "gate-2-passed": chalk.blue,
    "gate-3-passed": chalk.blue,
    "clarified": chalk.cyan,
    "planned": chalk.magenta,
    "tasked": chalk.yellow,
    "in-progress": chalk.yellow,
    "tested": chalk.greenBright,
    "completed": chalk.green,
  };
  const colorFn = colors[status] ?? chalk.white;
  return colorFn(status);
}
