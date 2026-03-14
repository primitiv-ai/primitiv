import { ConstitutionManager } from "./ConstitutionManager.js";
import type { ProductConstitutionFrontmatter } from "../schemas/constitution.js";
import type { ParsedDocument } from "../utils/frontmatter.js";
import { nextFeatureId } from "../utils/ids.js";

export class FeatureRegistryManager {
  private constitutionManager: ConstitutionManager;

  constructor(private projectRoot: string) {
    this.constitutionManager = new ConstitutionManager(projectRoot);
  }

  listFeatures(): ProductConstitutionFrontmatter["featureRegistry"] {
    if (!this.constitutionManager.exists("product")) return [];
    const doc = this.constitutionManager.get("product") as ParsedDocument<ProductConstitutionFrontmatter>;
    return doc.data.featureRegistry;
  }

  registerFeature(name: string): string {
    const id = nextFeatureId(this.projectRoot);
    const doc = this.constitutionManager.get("product") as ParsedDocument<ProductConstitutionFrontmatter>;
    const updated: ProductConstitutionFrontmatter = {
      ...doc.data,
      featureRegistry: [
        ...doc.data.featureRegistry,
        { id, name, status: "planned" as const },
      ],
      updatedAt: new Date().toISOString(),
    };
    this.constitutionManager.write("product", updated as unknown as Record<string, unknown>, doc.content);
    return id;
  }
}
