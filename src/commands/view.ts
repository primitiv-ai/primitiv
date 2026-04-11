import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import open from "open";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { NotInitializedError } from "../utils/errors.js";

export interface ViewOptions {
  port: number;
  open: boolean;
}

export interface ViewHandle {
  child: ChildProcess;
  url: string;
  exited: Promise<number>;
}

export async function runView(targetDir: string, options: ViewOptions): Promise<ViewHandle> {
  if (!isPrimitivInitialized(targetDir)) {
    throw new NotInitializedError();
  }

  const bundlePath = getViewerBundlePath();
  if (!existsSync(bundlePath)) {
    throw new Error(
      `Viewer bundle not found at ${bundlePath}. ` +
        "Run 'npm run build:viewer' from the repo root to build it.",
    );
  }

  const portFree = await isPortFree(options.port);
  if (!portFree) {
    throw new Error(
      `Port ${options.port} is already in use. ` +
        `Try a different port with --port <n>.`,
    );
  }

  const url = `http://127.0.0.1:${options.port}`;
  console.log(chalk.cyan(`Starting Primitiv viewer at ${url}`));

  const child = spawn(process.execPath, [bundlePath], {
    env: {
      ...process.env,
      PRIMITIV_PROJECT_ROOT: targetDir,
      PORT: String(options.port),
      HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "inherit"],
  });

  let readyFired = false;
  let exitedResolve!: (code: number) => void;
  const exited = new Promise<number>((r) => {
    exitedResolve = r;
  });

  let readyResolve!: () => void;
  let readyReject!: (err: Error) => void;
  const ready = new Promise<void>((r, j) => {
    readyResolve = r;
    readyReject = j;
  });

  let buffer = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      process.stdout.write(`${line}\n`);
      if (!readyFired && line.startsWith("VIEWER_READY")) {
        readyFired = true;
        readyResolve();
      }
    }
  });

  child.once("error", (err) => {
    if (!readyFired) readyReject(err);
  });

  child.once("exit", (code) => {
    if (!readyFired) {
      readyReject(new Error(`Viewer exited before becoming ready (code ${code ?? "null"})`));
    }
    exitedResolve(code ?? 0);
  });

  try {
    await ready;
  } catch (err) {
    throw err;
  }

  console.log(chalk.green(`✓ Viewer running at ${url}`));

  if (options.open) {
    try {
      await open(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(chalk.yellow(`Warning: failed to open browser: ${msg}`));
    }
  }

  const forward = (sig: NodeJS.Signals) => {
    if (!child.killed) child.kill(sig);
  };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));

  return { child, url, exited };
}

function getViewerBundlePath(): string {
  const override = process.env.PRIMITIV_VIEWER_BUNDLE;
  if (override) return override;
  // The CLI is bundled to dist/bin/primitiv.js by esbuild. The viewer
  // standalone bundle lives at dist/viewer/apps/viewer/server.js, so from
  // dist/bin/ we go up once and then into viewer/apps/viewer/.
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "viewer", "apps", "viewer", "server.js");
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const srv = createServer();
    srv.once("error", () => resolvePromise(false));
    srv.once("listening", () => {
      srv.close(() => resolvePromise(true));
    });
    srv.listen(port, "127.0.0.1");
  });
}
