import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  getPrimitivRoot,
  ensurePrimitivDir,
  isPrimitivInitialized,
  readPrimitivFile,
  writePrimitivFile,
  primitivFileExists,
} from "../src/utils/fileSystem.js";

describe("fileSystem", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `primitiv-fs-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  it("getPrimitivRoot returns .primitiv path", () => {
    expect(getPrimitivRoot(testDir)).toBe(join(testDir, ".primitiv"));
  });

  it("ensurePrimitivDir creates directory structure", () => {
    ensurePrimitivDir(testDir);
    expect(existsSync(join(testDir, ".primitiv"))).toBe(true);
    expect(existsSync(join(testDir, ".primitiv", "gates"))).toBe(true);
    expect(existsSync(join(testDir, ".primitiv", "constitutions"))).toBe(true);
    expect(existsSync(join(testDir, ".primitiv", "specs"))).toBe(true);
  });

  it("isPrimitivInitialized detects .primitiv", () => {
    expect(isPrimitivInitialized(testDir)).toBe(false);
    ensurePrimitivDir(testDir);
    expect(isPrimitivInitialized(testDir)).toBe(true);
  });

  it("writePrimitivFile creates file with directories", () => {
    ensurePrimitivDir(testDir);
    writePrimitivFile(testDir, ["gates", "test.md"], "hello");
    expect(primitivFileExists(testDir, "gates", "test.md")).toBe(true);
  });

  it("readPrimitivFile reads written content", () => {
    ensurePrimitivDir(testDir);
    writePrimitivFile(testDir, ["gates", "test.md"], "hello world");
    expect(readPrimitivFile(testDir, "gates", "test.md")).toBe("hello world");
  });
});
