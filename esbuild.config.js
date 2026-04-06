import { build } from "esbuild";
import { execSync } from "child_process";
import { rmSync, readFileSync, writeFileSync } from "fs";
import { builtinModules } from "module";

// Node built-in modules (both "fs" and "node:fs" forms)
const nodeExternals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// Clean dist/
rmSync("dist", { recursive: true, force: true });

// Generate type declarations with tsc
execSync("tsc --emitDeclarationOnly --declaration --outDir dist", {
  stdio: "inherit",
});

const shared = {
  bundle: true,
  minify: true,
  platform: "node",
  format: "esm",
  target: "node18",
  // Provide a real require() for bundled CJS deps running in ESM
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
};

// Bundle CLI entry point — bundle all deps into a single file
await build({
  ...shared,
  entryPoints: ["bin/primitiv.ts"],
  outfile: "dist/bin/primitiv.js",
  banner: {
    js: `#!/usr/bin/env node\n${shared.banner.js}`,
  },
});

// Ensure no duplicate shebangs
const cliBundlePath = "dist/bin/primitiv.js";
const cliContent = readFileSync(cliBundlePath, "utf8");
const lines = cliContent.split("\n");
// Remove any shebang lines after the first one
const filtered = lines.filter(
  (line, i) => i === 0 || !line.startsWith("#!")
);
writeFileSync(cliBundlePath, filtered.join("\n"));

// Bundle SDK entry point — keep deps external (consumers install them)
await build({
  ...shared,
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  external: Object.keys(pkg.dependencies || {}),
});

console.log("Build complete — bundled and minified.");
