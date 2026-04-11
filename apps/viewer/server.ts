import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import chokidar from "chokidar";

const port = Number(process.env.PORT ?? 3141);
const host = process.env.HOST ?? "127.0.0.1";
const projectRoot = process.env.PRIMITIV_PROJECT_ROOT;

const here = dirname(fileURLToPath(import.meta.url));

const app = next({
  dev: false,
  hostname: host,
  port,
  dir: here,
});
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => {
  const parsedUrl = parse(req.url ?? "/", true);
  handle(req, res, parsedUrl).catch((err: unknown) => {
    console.error("Request handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });
});

const wss = new WebSocketServer({ server: httpServer, path: "/__primitiv_live" });
wss.on("connection", () => {
  // live-reload bridge — silent
});

function broadcast(message: Record<string, unknown>): void {
  const text = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(text);
    }
  }
}

if (projectRoot) {
  const watchTarget = resolve(projectRoot, ".primitiv");
  const watcher = chokidar.watch(watchTarget, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
  });
  let debounceTimer: NodeJS.Timeout | null = null;
  const triggerRefresh = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcast({ type: "refresh" });
      debounceTimer = null;
    }, 200);
  };
  watcher.on("add", triggerRefresh);
  watcher.on("change", triggerRefresh);
  watcher.on("unlink", triggerRefresh);
  watcher.on("addDir", triggerRefresh);
  watcher.on("unlinkDir", triggerRefresh);
}

httpServer.listen(port, host, () => {
  console.log(`VIEWER_READY http://${host}:${port}`);
});

const shutdown = (): void => {
  httpServer.close();
  wss.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
