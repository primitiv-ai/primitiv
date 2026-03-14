import { PrimitivEngine } from "../engine/PrimitivEngine.js";
import Table from "cli-table3";
import chalk from "chalk";

export async function runStatus(targetDir: string, specId?: string): Promise<void> {
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

  const specs = engine.listSpecs();
  if (specs.length === 0) {
    console.log(chalk.yellow("\nNo specs found. Create one with /primitiv.specify"));
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
