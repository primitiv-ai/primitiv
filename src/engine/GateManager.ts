import { readPrimitivFile, writePrimitivFile, primitivFileExists } from "../utils/fileSystem.js";
import { parseDocument, serializeDocument } from "../utils/frontmatter.js";
import { CompanyPrinciplesFrontmatterSchema, SecurityPrinciplesFrontmatterSchema } from "../schemas/gates.js";
import type { CompanyPrinciplesFrontmatter, SecurityPrinciplesFrontmatter } from "../schemas/gates.js";
import type { GateType } from "../schemas/common.js";
import type { ParsedDocument } from "../utils/frontmatter.js";
import { GateNotFoundError } from "../utils/errors.js";

const GATE_FILES: Record<GateType, string> = {
  company: "gates/company-principles.md",
  security: "gates/security-principles.md",
};

export class GateManager {
  constructor(private projectRoot: string) {}

  exists(gate: GateType): boolean {
    return primitivFileExists(this.projectRoot, ...GATE_FILES[gate].split("/"));
  }

  getCompanyPrinciples() {
    if (!this.exists("company")) throw new GateNotFoundError("company");
    const raw = readPrimitivFile(this.projectRoot, "gates", "company-principles.md");
    return parseDocument(raw, CompanyPrinciplesFrontmatterSchema);
  }

  getSecurityPrinciples() {
    if (!this.exists("security")) throw new GateNotFoundError("security");
    const raw = readPrimitivFile(this.projectRoot, "gates", "security-principles.md");
    return parseDocument(raw, SecurityPrinciplesFrontmatterSchema);
  }

  getGate(gate: GateType): ParsedDocument<CompanyPrinciplesFrontmatter | SecurityPrinciplesFrontmatter> {
    if (gate === "company") return this.getCompanyPrinciples();
    return this.getSecurityPrinciples();
  }

  writeGate(gate: GateType, data: Record<string, unknown>, content: string): void {
    const serialized = serializeDocument(data, content);
    const [dir, file] = GATE_FILES[gate].split("/");
    writePrimitivFile(this.projectRoot, [dir, file], serialized);
  }
}
