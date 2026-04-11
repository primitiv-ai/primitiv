import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { getEngine } from "./engine";

export interface LearningRow {
  id: string;
  title: string;
  type: string;
  severity: string;
  tags: string[];
}

export interface LearningDetailOk {
  ok: true;
  id: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface LearningDetailError {
  ok: false;
  id: string;
  parseError: string;
  rawBody: string;
  filePath: string;
}

export type LearningDetailResult = LearningDetailOk | LearningDetailError | null;

export function loadLearningsList(): LearningRow[] {
  const engine = getEngine();
  if (!engine.initialized) return [];
  try {
    const records = engine.learnings.list();
    return records.map((record) => {
      const data = record as unknown as Record<string, unknown>;
      return {
        id: String(data.id ?? "UNKNOWN"),
        title: String(data.title ?? ""),
        type: String(data.type ?? ""),
        severity: String(data.severity ?? "info"),
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      };
    });
  } catch {
    return [];
  }
}

export function loadLearningDetail(id: string): LearningDetailResult {
  const engine = getEngine();
  if (!engine.initialized) return null;
  const filePath = join(engine.projectRoot, ".primitiv", "learnings", `${id}.md`);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, "utf-8");
  try {
    const parsed = matter(raw);
    return {
      ok: true,
      id,
      frontmatter: parsed.data as Record<string, unknown>,
      body: parsed.content,
    };
  } catch (err) {
    return {
      ok: false,
      id,
      parseError: err instanceof Error ? err.message : String(err),
      rawBody: raw,
      filePath,
    };
  }
}
