import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { slugify, loadState, saveState, nextSpecId, nextFeatureId } from "../src/utils/ids.js";

describe("slugify", () => {
  it("converts to lowercase slug", () => {
    expect(slugify("User Authentication")).toBe("user-authentication");
  });

  it("removes special characters", () => {
    expect(slugify("OAuth2 + MFA for Trading!")).toBe("oauth2-mfa-for-trading");
  });

  it("truncates to 50 chars", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(50);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("state management", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `primitiv-test-${Date.now()}`);
    mkdirSync(join(testDir, ".primitiv"), { recursive: true });
  });

  it("loads default state when file missing", () => {
    const state = loadState(testDir);
    expect(state.nextSpecId).toBe(1);
    expect(state.nextFeatureId).toBe(1);
  });

  it("saves and loads state", () => {
    const state = {
      nextSpecId: 5,
      nextFeatureId: 3,

      mode: "greenfield" as const,
      initializedAt: new Date().toISOString(),
    };
    saveState(testDir, state);
    const loaded = loadState(testDir);
    expect(loaded.nextSpecId).toBe(5);
    expect(loaded.nextFeatureId).toBe(3);
  });

  it("generates sequential spec IDs", () => {
    saveState(testDir, {
      nextSpecId: 1,
      nextFeatureId: 1,

      mode: "greenfield",
      initializedAt: new Date().toISOString(),
    });
    expect(nextSpecId(testDir)).toBe("SPEC-001");
    expect(nextSpecId(testDir)).toBe("SPEC-002");
    expect(nextSpecId(testDir)).toBe("SPEC-003");
  });

  it("generates sequential feature IDs", () => {
    saveState(testDir, {
      nextSpecId: 1,
      nextFeatureId: 1,

      mode: "greenfield",
      initializedAt: new Date().toISOString(),
    });
    expect(nextFeatureId(testDir)).toBe("FEAT-001");
    expect(nextFeatureId(testDir)).toBe("FEAT-002");
  });
});
