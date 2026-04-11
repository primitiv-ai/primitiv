import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { getEngine } from "./engine";

export type ConstitutionName = "product" | "development" | "architecture";

export interface ConstitutionDetailOk {
  ok: true;
  name: ConstitutionName;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface ConstitutionDetailError {
  ok: false;
  name: ConstitutionName;
  parseError: string;
  rawBody: string;
  filePath: string;
}

export type ConstitutionDetailResult =
  | ConstitutionDetailOk
  | ConstitutionDetailError
  | null;

export function loadConstitution(name: ConstitutionName): ConstitutionDetailResult {
  const engine = getEngine();
  if (!engine.initialized) return null;

  const filePath = join(engine.projectRoot, ".primitiv", "constitutions", `${name}.md`);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, "utf-8");
  try {
    const parsed = matter(raw);
    return {
      ok: true,
      name,
      frontmatter: parsed.data as Record<string, unknown>,
      body: parsed.content,
    };
  } catch (err) {
    return {
      ok: false,
      name,
      parseError: err instanceof Error ? err.message : String(err),
      rawBody: raw,
      filePath,
    };
  }
}

export function constitutionExists(name: ConstitutionName): boolean {
  const engine = getEngine();
  if (!engine.initialized) return false;
  const filePath = join(engine.projectRoot, ".primitiv", "constitutions", `${name}.md`);
  return existsSync(filePath);
}
