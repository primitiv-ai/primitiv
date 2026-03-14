import { readPrimitivFile, writePrimitivFile, primitivFileExists } from "../utils/fileSystem.js";
import { parseDocument, serializeDocument } from "../utils/frontmatter.js";
import {
  ProductConstitutionFrontmatterSchema,
  DevConstitutionFrontmatterSchema,
  ArchConstitutionFrontmatterSchema,
} from "../schemas/constitution.js";
import type {
  ProductConstitutionFrontmatter,
  DevConstitutionFrontmatter,
  ArchConstitutionFrontmatter,
} from "../schemas/constitution.js";
import type { ConstitutionType } from "../schemas/common.js";
import type { ParsedDocument } from "../utils/frontmatter.js";
import { ConstitutionNotFoundError } from "../utils/errors.js";

const CONSTITUTION_FILES: Record<ConstitutionType, string> = {
  product: "constitutions/product.md",
  dev: "constitutions/development.md",
  architecture: "constitutions/architecture.md",
};

type AnyConstitutionFrontmatter =
  | ProductConstitutionFrontmatter
  | DevConstitutionFrontmatter
  | ArchConstitutionFrontmatter;

export class ConstitutionManager {
  constructor(private projectRoot: string) {}

  exists(type: ConstitutionType): boolean {
    return primitivFileExists(this.projectRoot, ...CONSTITUTION_FILES[type].split("/"));
  }

  get(type: ConstitutionType): ParsedDocument<AnyConstitutionFrontmatter> {
    if (!this.exists(type)) throw new ConstitutionNotFoundError(type);
    const raw = readPrimitivFile(this.projectRoot, ...CONSTITUTION_FILES[type].split("/"));
    switch (type) {
      case "product":
        return parseDocument(raw, ProductConstitutionFrontmatterSchema);
      case "dev":
        return parseDocument(raw, DevConstitutionFrontmatterSchema);
      case "architecture":
        return parseDocument(raw, ArchConstitutionFrontmatterSchema);
    }
  }

  write(type: ConstitutionType, data: Record<string, unknown>, content: string): void {
    const serialized = serializeDocument(data, content);
    const pathParts = CONSTITUTION_FILES[type].split("/");
    writePrimitivFile(this.projectRoot, pathParts, serialized);
  }
}
