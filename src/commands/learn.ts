import chalk from "chalk";
import Table from "cli-table3";
import { PrimitivEngine } from "../engine/PrimitivEngine.js";
import type { LearningType, LearningSeverity, LearningSource } from "../schemas/learning.js";

const VALID_TYPES = ["best-practice", "error-resolution", "convention"] as const;
const VALID_SEVERITIES = ["info", "important", "critical"] as const;
const VALID_SOURCES = ["user", "gate-failure", "test-failure", "clarification", "review"] as const;

export async function runLearnAdd(
  projectRoot: string,
  options: {
    type: string;
    title: string;
    description?: string;
    tags?: string;
    severity?: string;
    spec?: string;
    source?: string;
  },
): Promise<void> {
  if (!VALID_TYPES.includes(options.type as LearningType)) {
    console.error(chalk.red(`Invalid type: "${options.type}". Valid types: ${VALID_TYPES.join(", ")}`));
    process.exitCode = 1;
    return;
  }

  if (options.severity && !VALID_SEVERITIES.includes(options.severity as LearningSeverity)) {
    console.error(chalk.red(`Invalid severity: "${options.severity}". Valid: ${VALID_SEVERITIES.join(", ")}`));
    process.exitCode = 1;
    return;
  }

  if (options.source && !VALID_SOURCES.includes(options.source as LearningSource)) {
    console.error(chalk.red(`Invalid source: "${options.source}". Valid: ${VALID_SOURCES.join(", ")}`));
    process.exitCode = 1;
    return;
  }

  const engine = PrimitivEngine.load(projectRoot);
  const tags = options.tags ? options.tags.split(",").map(t => t.trim()) : [];

  const record = engine.learnings.create({
    learningType: options.type as LearningType,
    title: options.title,
    description: options.description ?? "",
    tags,
    severity: (options.severity as LearningSeverity) ?? "info",
    source: (options.source as LearningSource) ?? "user",
    specId: options.spec ?? null,
  });

  console.log(chalk.green(`\n✓ Created learning ${record.data.id}: ${record.data.title}`));
  console.log(chalk.dim(`  Type:     ${record.data.learningType}`));
  console.log(chalk.dim(`  Severity: ${record.data.severity}`));
  if (tags.length > 0) {
    console.log(chalk.dim(`  Tags:     ${tags.join(", ")}`));
  }
  if (record.data.specId) {
    console.log(chalk.dim(`  Spec:     ${record.data.specId}`));
  }
}

export async function runLearnList(
  projectRoot: string,
  options: { type?: string; tag?: string },
): Promise<void> {
  const engine = PrimitivEngine.load(projectRoot);
  const learnings = engine.learnings.list({
    learningType: options.type as LearningType | undefined,
    tag: options.tag,
  });

  if (learnings.length === 0) {
    console.log(chalk.yellow("\nNo learnings recorded yet."));
    console.log(chalk.dim("  Hint: use `primitiv learn add` to record a learning"));
    return;
  }

  const table = new Table({
    head: [
      chalk.bold("ID"),
      chalk.bold("Type"),
      chalk.bold("Title"),
      chalk.bold("Severity"),
      chalk.bold("Tags"),
    ],
  });

  for (const l of learnings) {
    const severityColor = l.data.severity === "critical"
      ? chalk.red
      : l.data.severity === "important"
        ? chalk.yellow
        : chalk.dim;

    table.push([
      l.data.id,
      l.data.learningType,
      l.data.title,
      severityColor(l.data.severity),
      l.data.tags.join(", ") || chalk.dim("—"),
    ]);
  }

  console.log(`\n${table.toString()}\n`);
  console.log(chalk.dim(`  ${learnings.length} learning${learnings.length === 1 ? "" : "s"} total`));
}

export async function runLearnSearch(
  projectRoot: string,
  query: string,
): Promise<void> {
  const engine = PrimitivEngine.load(projectRoot);
  const results = engine.learnings.search(query);

  if (results.length === 0) {
    console.log(chalk.yellow(`\nNo learnings matching "${query}".`));
    return;
  }

  console.log(chalk.bold(`\n${results.length} result${results.length === 1 ? "" : "s"} for "${query}":\n`));

  for (const r of results) {
    const icon = r.data.severity === "critical" || r.data.severity === "important" ? "⚠" : "ℹ";
    console.log(`  ${icon} ${chalk.bold(r.data.id)}: ${r.data.title}`);
    if (r.description) {
      const preview = r.description.slice(0, 100) + (r.description.length > 100 ? "..." : "");
      console.log(chalk.dim(`    ${preview}`));
    }
  }
}

export async function runLearnRemove(
  projectRoot: string,
  id: string,
): Promise<void> {
  const engine = PrimitivEngine.load(projectRoot);
  const deleted = engine.learnings.delete(id);

  if (deleted) {
    console.log(chalk.green(`\n✓ Removed learning ${id}`));
  } else {
    console.error(chalk.red(`\nLearning ${id} not found.`));
    process.exitCode = 1;
  }
}
