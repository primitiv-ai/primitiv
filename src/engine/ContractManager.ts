import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getSpecDir } from "../utils/fileSystem.js";

export class ContractManager {
  constructor(private projectRoot: string) {}

  writeContract(specId: string, filename: string, content: string): void {
    const contractsDir = this.getContractsDir(specId);
    if (!existsSync(contractsDir)) {
      mkdirSync(contractsDir, { recursive: true });
    }
    const filePath = join(contractsDir, filename);
    writeFileSync(filePath, content);
  }

  readContract(specId: string, filename: string): string | null {
    const filePath = join(this.getContractsDir(specId), filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, "utf-8");
  }

  listContracts(specId: string): string[] {
    const contractsDir = this.getContractsDir(specId);
    if (!existsSync(contractsDir)) return [];
    return readdirSync(contractsDir, { withFileTypes: true })
      .filter(d => d.isFile() && (d.name.endsWith(".yaml") || d.name.endsWith(".yml")))
      .map(d => d.name);
  }

  private getContractsDir(specId: string): string {
    const dir = getSpecDir(this.projectRoot, specId);
    return join(dir, "contracts");
  }
}
