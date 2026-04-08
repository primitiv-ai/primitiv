import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

interface StateFile {
  nextSpecId: number;
  nextFeatureId: number;
  nextLearningId?: number;
  primitivVersion?: string;
  mode: "greenfield" | "brownfield";
  initializedAt: string;
}

const STATE_FILE = ".state.json";

function getStatePath(projectRoot: string): string {
  return join(projectRoot, ".primitiv", STATE_FILE);
}

export function loadState(projectRoot: string): StateFile {
  const path = getStatePath(projectRoot);
  if (!existsSync(path)) {
    return {
      nextSpecId: 1,
      nextFeatureId: 1,
      mode: "greenfield",
      initializedAt: new Date().toISOString(),
    };
  }
  return JSON.parse(readFileSync(path, "utf-8")) as StateFile;
}

export function saveState(projectRoot: string, state: StateFile): void {
  const path = getStatePath(projectRoot);
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n");
}

export function nextSpecId(projectRoot: string): string {
  const state = loadState(projectRoot);
  const id = `SPEC-${String(state.nextSpecId).padStart(3, "0")}`;
  state.nextSpecId++;
  saveState(projectRoot, state);
  return id;
}

export function nextFeatureId(projectRoot: string): string {
  const state = loadState(projectRoot);
  const id = `FEAT-${String(state.nextFeatureId).padStart(3, "0")}`;
  state.nextFeatureId++;
  saveState(projectRoot, state);
  return id;
}

export function nextLearningId(projectRoot: string): string {
  const state = loadState(projectRoot);
  const id = `LEARN-${String(state.nextLearningId ?? 1).padStart(3, "0")}`;
  state.nextLearningId = (state.nextLearningId ?? 1) + 1;
  saveState(projectRoot, state);
  return id;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
