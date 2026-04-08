import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function getPackageVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Walk up from src/utils/ or dist/src/utils/ to find package.json
    let dir = __dirname;
    for (let i = 0; i < 5; i++) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
        if (pkg.name === "primitiv" && pkg.version) {
          return pkg.version as string;
        }
      } catch {
        // No package.json at this level, keep walking up
      }
      dir = dirname(dir);
    }
    return "0.0.0";
  } catch {
    return "0.0.0";
  }
}
