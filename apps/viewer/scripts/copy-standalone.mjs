import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const viewerDir = resolve(here, "..");
const repoRoot = resolve(viewerDir, "..", "..");
const standaloneDir = join(viewerDir, ".next", "standalone");
const staticDir = join(viewerDir, ".next", "static");
const publicDir = join(viewerDir, "public");
const targetDir = join(repoRoot, "dist", "viewer");
const targetViewerDir = join(targetDir, "apps", "viewer");

if (!existsSync(standaloneDir)) {
  console.error("Standalone bundle not found. Run `next build` in apps/viewer first.");
  process.exit(1);
}

console.log(`[copy-standalone] clearing ${targetDir}`);
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });

console.log(`[copy-standalone] copying standalone bundle`);
cpSync(standaloneDir, targetDir, { recursive: true });

if (existsSync(staticDir)) {
  const staticTarget = join(targetViewerDir, ".next", "static");
  console.log(`[copy-standalone] copying static assets`);
  mkdirSync(dirname(staticTarget), { recursive: true });
  cpSync(staticDir, staticTarget, { recursive: true });
}

if (existsSync(publicDir)) {
  const publicTarget = join(targetViewerDir, "public");
  console.log(`[copy-standalone] copying public assets`);
  cpSync(publicDir, publicTarget, { recursive: true });
}

// The prebuilt Next.js standalone server.js at
// dist/viewer/apps/viewer/server.js is what `primitiv view` spawns.
// Custom server.ts (with chokidar + WebSocket live reload) is not wired
// into the standalone bundle yet — see the notes in apps/viewer/server.ts.
// Live reload is deferred to a follow-up spec; the viewer still reads the
// filesystem on every request because all routes are force-dynamic.

console.log(`[copy-standalone] viewer bundle ready at ${targetDir}`);
