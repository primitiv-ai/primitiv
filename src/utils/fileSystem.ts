import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PRIMITIV_DIR = ".primitiv";

export function getPrimitivRoot(projectRoot: string): string {
  return join(projectRoot, PRIMITIV_DIR);
}

export function ensurePrimitivDir(projectRoot: string): void {
  const root = getPrimitivRoot(projectRoot);
  const dirs = [
    root,
    join(root, "gates"),
    join(root, "constitutions"),
    join(root, "specs"),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export function isPrimitivInitialized(projectRoot: string): boolean {
  return existsSync(getPrimitivRoot(projectRoot));
}

export function readPrimitivFile(projectRoot: string, ...pathSegments: string[]): string {
  const filePath = join(getPrimitivRoot(projectRoot), ...pathSegments);
  return readFileSync(filePath, "utf-8");
}

export function writePrimitivFile(
  projectRoot: string,
  pathSegments: string[],
  content: string
): void {
  const filePath = join(getPrimitivRoot(projectRoot), ...pathSegments);
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content);
}

export function primitivFileExists(projectRoot: string, ...pathSegments: string[]): boolean {
  return existsSync(join(getPrimitivRoot(projectRoot), ...pathSegments));
}

export function listSpecDirs(projectRoot: string): string[] {
  const specsDir = join(getPrimitivRoot(projectRoot), "specs");
  if (!existsSync(specsDir)) return [];
  return readdirSync(specsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

export function getSpecDir(projectRoot: string, specId: string): string {
  const specsDir = join(getPrimitivRoot(projectRoot), "specs");
  const dirs = readdirSync(specsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith(specId))
    .map(d => d.name);
  if (dirs.length === 0) {
    // Return a path based on the specId alone
    return join(specsDir, specId);
  }
  return join(specsDir, dirs[0]);
}
