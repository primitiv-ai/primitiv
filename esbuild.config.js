import { build } from "esbuild";
import { execSync } from "child_process";
import { rmSync, readFileSync, writeFileSync, existsSync } from "fs";
import { builtinModules } from "module";

// Node built-in modules (both "fs" and "node:fs" forms)
const nodeExternals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// Clean dist/
rmSync("dist", { recursive: true, force: true });

// Full tsc compile — produces both .js and .d.ts under dist/.
// The esbuild bundling below overwrites dist/bin/primitiv.js and
// dist/index.js with bundled/minified versions, but leaves the rest
// of dist/src/* alone. The viewer (SPEC-013) imports engine modules
// from dist/src/engine/*.js via its @cli/* path alias, so these files
// must exist before `next build` runs for apps/viewer.
execSync("tsc --outDir dist", {
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

// Build the viewer (SPEC-013) and copy its standalone bundle into dist/viewer/
if (process.env.SKIP_VIEWER_BUILD) {
  console.log("Build complete — viewer build skipped via SKIP_VIEWER_BUILD.");
} else if (!existsSync("apps/viewer/node_modules")) {
  console.warn(
    "Skipping viewer build: apps/viewer/node_modules not installed. Run `npm install` inside apps/viewer/ before publishing.",
  );
} else {
  console.log("Building apps/viewer (Next.js 16 standalone)...");
  execSync("npm run build", { cwd: "apps/viewer", stdio: "inherit" });
  console.log("Copying viewer standalone bundle into dist/viewer/...");
  execSync("node scripts/copy-standalone.mjs", { cwd: "apps/viewer", stdio: "inherit" });
}

console.log("Build complete — bundled and minified.");
