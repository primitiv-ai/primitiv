import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { getEngine } from "./engine";

export type GateName = "company-principles" | "security-principles";

export interface GateDetailOk {
  ok: true;
  name: GateName;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface GateDetailError {
  ok: false;
  name: GateName;
  parseError: string;
  rawBody: string;
  filePath: string;
}

export type GateDetailResult = GateDetailOk | GateDetailError | null;

export function loadGate(name: GateName): GateDetailResult {
  const engine = getEngine();
  if (!engine.initialized) return null;

  const filePath = join(engine.projectRoot, ".primitiv", "gates", `${name}.md`);
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

export function gateExists(name: GateName): boolean {
  const engine = getEngine();
  if (!engine.initialized) return false;
  const filePath = join(engine.projectRoot, ".primitiv", "gates", `${name}.md`);
  return existsSync(filePath);
}
