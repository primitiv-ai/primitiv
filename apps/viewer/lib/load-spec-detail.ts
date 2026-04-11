import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { getEngine } from "./engine";

export type ArtifactKey =
  | "spec"
  | "clarifications"
  | "plan"
  | "tasks"
  | "test-results"
  | "research";

export interface SpecDetailOk {
  ok: true;
  id: string;
  title: string;
  status: string;
  frontmatter: Record<string, unknown>;
  body: string;
  artifacts: Partial<Record<ArtifactKey, string>>;
}

export interface SpecDetailError {
  ok: false;
  id: string;
  parseError: string;
  rawBody: string;
  filePath: string;
}

export type SpecDetailResult = SpecDetailOk | SpecDetailError | null;

function readOptional(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

function findSpecDir(projectRoot: string, specId: string): string | null {
  const specsDir = join(projectRoot, ".primitiv", "specs");
  if (!existsSync(specsDir)) return null;
  try {
    const entries = readdirSync(specsDir);
    const match = entries.find((name) => name.startsWith(`${specId}-`) || name === specId);
    return match ? join(specsDir, match) : null;
  } catch {
    return null;
  }
}

export function loadSpecDetail(specId: string): SpecDetailResult {
  const engine = getEngine();
  if (!engine.initialized) return null;

  const specDir = findSpecDir(engine.projectRoot, specId);
  if (!specDir) return null;

  const specPath = join(specDir, "spec.md");
  if (!existsSync(specPath)) return null;

  const raw = readFileSync(specPath, "utf-8");
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (err) {
    return {
      ok: false,
      id: specId,
      parseError: err instanceof Error ? err.message : String(err),
      rawBody: raw,
      filePath: specPath,
    };
  }

  const frontmatter = parsed.data as Record<string, unknown>;
  const title = typeof frontmatter.title === "string" ? frontmatter.title : specId;
  const status = typeof frontmatter.status === "string" ? frontmatter.status : "unknown";

  const artifacts: Partial<Record<ArtifactKey, string>> = { spec: parsed.content };
  const clar = readOptional(join(specDir, "clarifications.md"));
  if (clar) artifacts.clarifications = clar;
  const plan = readOptional(join(specDir, "plan.md"));
  if (plan) artifacts.plan = plan;
  const tasks = readOptional(join(specDir, "tasks.md"));
  if (tasks) artifacts.tasks = tasks;
  const results = readOptional(join(specDir, "test-results.md"));
  if (results) artifacts["test-results"] = results;
  const research = readOptional(join(specDir, "research.md"));
  if (research) artifacts.research = research;

  return {
    ok: true,
    id: specId,
    title,
    status,
    frontmatter,
    body: parsed.content,
    artifacts,
  };
}
