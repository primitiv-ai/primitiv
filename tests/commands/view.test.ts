import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer, type AddressInfo } from "node:net";
import { runView } from "../../src/commands/view.js";
import { NotInitializedError } from "../../src/utils/errors.js";

const STUB_SERVER_SOURCE = `
const http = require('node:http');
const port = Number(process.env.PORT);
const host = process.env.HOST || '127.0.0.1';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('hello from stub');
});
server.listen(port, host, () => {
  console.log('VIEWER_READY http://' + host + ':' + port);
});
const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
`;

async function getFreePort(): Promise<number> {
  return new Promise((resolvePromise, rejectPromise) => {
    const srv = createServer();
    srv.once("error", rejectPromise);
    srv.listen(0, "127.0.0.1", () => {
      const port = (srv.address() as AddressInfo).port;
      srv.close(() => resolvePromise(port));
    });
  });
}

describe("primitiv view command", () => {
  let testDir: string;
  let stubPath: string;

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `primitiv-view-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(join(testDir, ".primitiv"), { recursive: true });
    stubPath = join(testDir, "stub-server.cjs");
    writeFileSync(stubPath, STUB_SERVER_SOURCE);
    process.env.PRIMITIV_VIEWER_BUNDLE = stubPath;
  });

  afterEach(() => {
    delete process.env.PRIMITIV_VIEWER_BUNDLE;
    rmSync(testDir, { recursive: true, force: true });
  });

  it("starts the viewer, serves GET /, and exits cleanly on SIGTERM", async () => {
    const port = await getFreePort();
    const handle = await runView(testDir, { port, open: false });
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe("hello from stub");
    } finally {
      handle.child.kill("SIGTERM");
    }
    const code = await handle.exited;
    expect(code).toBe(0);
  });

  it("throws NotInitializedError when target dir has no .primitiv/", async () => {
    const bareDir = join(
      tmpdir(),
      `primitiv-view-bare-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(bareDir, { recursive: true });
    try {
      await expect(runView(bareDir, { port: 9999, open: false })).rejects.toBeInstanceOf(
        NotInitializedError,
      );
    } finally {
      rmSync(bareDir, { recursive: true, force: true });
    }
  });

  it("fails clearly when the requested port is already bound", async () => {
    const port = await getFreePort();
    const blocker = createServer();
    await new Promise<void>((resolvePromise, rejectPromise) => {
      blocker.once("error", rejectPromise);
      blocker.listen(port, "127.0.0.1", () => resolvePromise());
    });
    try {
      await expect(runView(testDir, { port, open: false })).rejects.toThrow(/already in use/);
    } finally {
      await new Promise<void>((resolvePromise) => blocker.close(() => resolvePromise()));
    }
  });

  it("fails with a clear message when the viewer bundle does not exist", async () => {
    const missingPath = join(testDir, "does-not-exist.cjs");
    process.env.PRIMITIV_VIEWER_BUNDLE = missingPath;
    const port = await getFreePort();
    await expect(runView(testDir, { port, open: false })).rejects.toThrow(/Viewer bundle not found/);
  });
});
