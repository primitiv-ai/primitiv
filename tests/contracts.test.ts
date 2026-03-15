import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractManager } from "../src/engine/ContractManager.js";

function createTempProject(): string {
  const root = mkdtempSync(join(tmpdir(), "primitiv-contracts-"));
  mkdirSync(join(root, ".primitiv", "specs", "SPEC-001-test"), { recursive: true });
  writeFileSync(join(root, ".primitiv", ".state.json"), JSON.stringify({ nextSpecId: 2 }));
  return root;
}

describe("ContractManager", () => {
  let root: string;
  let manager: ContractManager;

  beforeEach(() => {
    root = createTempProject();
    manager = new ContractManager(root);
  });

  it("creates contracts directory automatically", () => {
    manager.writeContract("SPEC-001", "api.yaml", "openapi: 3.1.0\n");
    const contractsDir = join(root, ".primitiv", "specs", "SPEC-001-test", "contracts");
    expect(existsSync(contractsDir)).toBe(true);
  });

  it("writes and reads a contract", () => {
    const content = "openapi: 3.1.0\ninfo:\n  title: Test API\n";
    manager.writeContract("SPEC-001", "api.yaml", content);
    const read = manager.readContract("SPEC-001", "api.yaml");
    expect(read).toBe(content);
  });

  it("returns null for missing contract", () => {
    const read = manager.readContract("SPEC-001", "nonexistent.yaml");
    expect(read).toBeNull();
  });

  it("lists yaml contracts", () => {
    manager.writeContract("SPEC-001", "api.yaml", "openapi: 3.1.0\n");
    manager.writeContract("SPEC-001", "webhooks.yml", "openapi: 3.1.0\n");
    const contracts = manager.listContracts("SPEC-001");
    expect(contracts).toContain("api.yaml");
    expect(contracts).toContain("webhooks.yml");
    expect(contracts).toHaveLength(2);
  });

  it("returns empty array for missing contracts directory", () => {
    const contracts = manager.listContracts("SPEC-001");
    expect(contracts).toEqual([]);
  });
});
