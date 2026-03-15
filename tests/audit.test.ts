import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AuditRecordSchema, AuditActionSchema } from "../src/schemas/audit.js";
import { AuditManager } from "../src/engine/AuditManager.js";

function createTempProject(): string {
  const root = mkdtempSync(join(tmpdir(), "primitiv-audit-"));
  mkdirSync(join(root, ".primitiv", "specs", "SPEC-001-test"), { recursive: true });
  writeFileSync(join(root, ".primitiv", ".state.json"), JSON.stringify({ nextSpecId: 2 }));
  return root;
}

describe("AuditRecordSchema", () => {
  it("validates a valid audit record", () => {
    const record = {
      timestamp: new Date().toISOString(),
      actor: "testuser",
      action: "SPEC_CREATED",
      specId: "SPEC-001",
      previousStatus: null,
      newStatus: "draft",
      details: null,
    };
    const result = AuditRecordSchema.parse(record);
    expect(result.action).toBe("SPEC_CREATED");
    expect(result.previousStatus).toBeNull();
  });

  it("rejects invalid action code", () => {
    expect(() =>
      AuditRecordSchema.parse({
        timestamp: new Date().toISOString(),
        actor: "testuser",
        action: "INVALID_ACTION",
        specId: "SPEC-001",
        previousStatus: null,
        newStatus: "draft",
      }),
    ).toThrow();
  });

  it("accepts all defined action codes", () => {
    const actions = [
      "SPEC_CREATED", "GATE_CHECK_PASSED", "GATE_CHECK_WARNED",
      "GATE_CHECK_FAILED", "SPEC_CLARIFIED", "SPEC_PLANNED",
      "SPEC_TASKED", "STATUS_CHANGED",
    ];
    for (const action of actions) {
      expect(AuditActionSchema.parse(action)).toBe(action);
    }
  });

  it("accepts details as an object", () => {
    const record = AuditRecordSchema.parse({
      timestamp: new Date().toISOString(),
      actor: "system",
      action: "GATE_CHECK_PASSED",
      specId: "SPEC-001",
      previousStatus: "draft",
      newStatus: "gate-1-passed",
      details: { gate: "company", violations: [] },
    });
    expect(record.details).toEqual({ gate: "company", violations: [] });
  });

  it("defaults details to null", () => {
    const record = AuditRecordSchema.parse({
      timestamp: new Date().toISOString(),
      actor: "user",
      action: "SPEC_CREATED",
      specId: "SPEC-001",
      previousStatus: null,
      newStatus: "draft",
    });
    expect(record.details).toBeNull();
  });
});

describe("AuditManager", () => {
  let root: string;
  let manager: AuditManager;

  beforeEach(() => {
    root = createTempProject();
    manager = new AuditManager(root);
  });

  it("creates audit.log when appending first record", () => {
    manager.appendAuditRecord("SPEC-001", "SPEC_CREATED", null, "draft");
    const logPath = join(root, ".primitiv", "specs", "SPEC-001-test", "audit.log");
    expect(existsSync(logPath)).toBe(true);
  });

  it("appends records as NDJSON (one JSON per line)", () => {
    manager.appendAuditRecord("SPEC-001", "SPEC_CREATED", null, "draft");
    manager.appendAuditRecord("SPEC-001", "STATUS_CHANGED", "draft", "gate-1-passed");

    const logPath = join(root, ".primitiv", "specs", "SPEC-001-test", "audit.log");
    const content = readFileSync(logPath, "utf-8").trim();
    const lines = content.split("\n");
    expect(lines).toHaveLength(2);

    // Each line must be valid JSON
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it("reads audit log as parsed records", () => {
    manager.appendAuditRecord("SPEC-001", "SPEC_CREATED", null, "draft");
    manager.appendAuditRecord("SPEC-001", "STATUS_CHANGED", "draft", "gate-1-passed");

    const records = manager.readAuditLog("SPEC-001");
    expect(records).toHaveLength(2);
    expect(records[0].action).toBe("SPEC_CREATED");
    expect(records[1].action).toBe("STATUS_CHANGED");
    expect(records[1].previousStatus).toBe("draft");
    expect(records[1].newStatus).toBe("gate-1-passed");
  });

  it("returns empty array for missing audit.log", () => {
    const records = manager.readAuditLog("SPEC-001");
    expect(records).toEqual([]);
  });

  it("includes details when provided", () => {
    manager.appendAuditRecord("SPEC-001", "GATE_CHECK_PASSED", "draft", "gate-1-passed", {
      gate: "company",
      violations: [],
    });

    const records = manager.readAuditLog("SPEC-001");
    expect(records[0].details).toEqual({ gate: "company", violations: [] });
  });
});
