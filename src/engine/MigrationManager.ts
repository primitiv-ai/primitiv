import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import { ensurePrimitivDir, primitivFileExists, writePrimitivFile, getPrimitivRoot } from "../utils/fileSystem.js";
import { loadState, saveState } from "../utils/ids.js";
import { serializeDocument } from "../utils/frontmatter.js";
import { MigrationNotFoundError } from "../utils/errors.js";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface SpecMapping {
  /** Original SpecKit directory name, e.g. "133-fix-package-upload-state" */
  original: string;
  /** Primitiv spec ID, e.g. "SPEC-001" */
  primitivId: string;
  /** Slug portion of the original dir name, e.g. "fix-package-upload-state" */
  slug: string;
  /** Primitiv directory name, e.g. "SPEC-001-fix-package-upload-state" */
  primitivDir: string;
}

export interface MigrationReport {
  specsMigrated: SpecMapping[];
  specsSkipped: string[];
  constitutionsMigrated: string[];
  constitutionsSkipped: string[];
  architectureMigrated: boolean;
  warnings: string[];
  errors: string[];
}

export interface ConstitutionSplitResult {
  product: string;
  development: string | null;
  shared: string;
  strategy: "h2-match" | "keyword-match" | "fallback";
}

export interface DetectionResult {
  found: boolean;
  specifyDir?: string;
  specsDir?: string;
  claudeMdPath?: string;
}

// ─── MigrationManager ───────────────────────────────────────────────────────

export class MigrationManager {
  constructor(private projectRoot: string) {}

  // ── Detection ────────────────────────────────────────────────────────────

  detectSpecKit(): DetectionResult {
    const specifyDir = join(this.projectRoot, ".specify");
    const specsDir = join(this.projectRoot, "specs");
    const claudeMdPath = join(this.projectRoot, "CLAUDE.md");

    const hasSpecify = existsSync(specifyDir);
    const hasSpecs = existsSync(specsDir);
    const hasClaudeMd = existsSync(claudeMdPath);

    const found = hasSpecify || hasSpecs;

    return {
      found,
      specifyDir: hasSpecify ? specifyDir : undefined,
      specsDir: hasSpecs ? specsDir : undefined,
      claudeMdPath: hasClaudeMd ? claudeMdPath : undefined,
    };
  }

  // ── Spec Discovery & Mapping ─────────────────────────────────────────────

  /**
   * Reads the SpecKit specs/ directory and returns sorted directory names
   * matching the <NNN>-<slug> pattern.
   */
  discoverSpecKitSpecs(specsDir: string): string[] {
    if (!existsSync(specsDir)) return [];

    const entries = readdirSync(specsDir, { withFileTypes: true });
    const specDirs = entries
      .filter(e => e.isDirectory() && /^\d+-[a-z0-9-]+$/.test(e.name))
      .map(e => e.name);

    // Sort by numeric prefix
    return specDirs.sort((a, b) => {
      const numA = parseInt(a.split("-")[0], 10);
      const numB = parseInt(b.split("-")[0], 10);
      return numA - numB;
    });
  }

  /**
   * Assigns sequential SPEC-001, SPEC-002, etc. to sorted spec dirs.
   * Returns a mapping from original dir name to Primitiv ID.
   */
  buildSpecMapping(specDirs: string[], startId: number = 1): SpecMapping[] {
    return specDirs.map((dirName, index) => {
      const id = index + startId;
      const primitivId = `SPEC-${String(id).padStart(3, "0")}`;
      // Extract slug: everything after the first hyphen
      const firstHyphen = dirName.indexOf("-");
      const slug = firstHyphen >= 0 ? dirName.slice(firstHyphen + 1) : dirName;

      return {
        original: dirName,
        primitivId,
        slug,
        primitivDir: `${primitivId}-${slug}`,
      };
    });
  }

  // ── Constitution Splitting ───────────────────────────────────────────────

  /**
   * Multi-strategy parser to split constitution.md into product and development sections.
   * Strategy 1: H2 header match (## Product Principles / ## Development Principles)
   * Strategy 2: Keyword fuzzy match at any heading level
   * Strategy 3: Fallback — entire content → product, development = null
   */
  splitConstitution(content: string): ConstitutionSplitResult {
    const lines = content.split("\n");

    // Shared section keywords
    const sharedKeywords = [
      "principle interlock",
      "unacceptable risks",
      "governance",
      "explicit exclusions",
      "amendment procedure",
      "anti-scope",
    ];

    // Strategy 1: H2 exact header match
    const result = this._splitByH2Headers(lines, sharedKeywords);
    if (result) return { ...result, strategy: "h2-match" };

    // Strategy 2: Keyword fuzzy match at any heading level
    const fuzzyResult = this._splitByKeywordMatch(lines, sharedKeywords);
    if (fuzzyResult) return { ...fuzzyResult, strategy: "keyword-match" };

    // Strategy 3: Fallback
    return {
      product: content,
      development: null,
      shared: "",
      strategy: "fallback",
    };
  }

  private _splitByH2Headers(
    lines: string[],
    sharedKeywords: string[]
  ): Omit<ConstitutionSplitResult, "strategy"> | null {
    let productStart = -1;
    let devStart = -1;
    const sharedRanges: Array<{ start: number; end: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("## ")) {
        const headerText = line.slice(3).trim().toLowerCase();
        if (headerText.includes("product principles")) {
          productStart = i;
        } else if (headerText.includes("development principles")) {
          devStart = i;
        } else if (sharedKeywords.some(kw => headerText.includes(kw))) {
          // Find end of this shared section (next ## or EOF)
          let end = lines.length;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim().startsWith("## ")) {
              end = j;
              break;
            }
          }
          sharedRanges.push({ start: i, end });
        }
      }
    }

    if (productStart === -1 && devStart === -1) return null;

    // Build shared content
    const sharedLines: string[] = [];
    for (const range of sharedRanges) {
      sharedLines.push(...lines.slice(range.start, range.end));
    }
    const shared = sharedLines.join("\n").trim();

    // Determine section boundaries
    // Content before productStart is preamble (title, intro) — goes to product
    const preamble = productStart > 0 ? lines.slice(0, productStart).join("\n").trim() : "";

    let productContent: string;
    let devContent: string | null = null;

    if (productStart >= 0 && devStart >= 0) {
      // Both sections found
      const firstSection = productStart < devStart ? "product" : "development";

      if (firstSection === "product") {
        // product comes first
        const productEnd = this._findSectionEnd(lines, productStart, [devStart, ...sharedRanges.map(r => r.start)]);
        productContent = lines.slice(productStart, productEnd).join("\n").trim();
        const devEnd = this._findSectionEnd(lines, devStart, sharedRanges.map(r => r.start));
        devContent = lines.slice(devStart, devEnd).join("\n").trim();
      } else {
        // development comes first
        const devEnd = this._findSectionEnd(lines, devStart, [productStart, ...sharedRanges.map(r => r.start)]);
        devContent = lines.slice(devStart, devEnd).join("\n").trim();
        const productEnd = this._findSectionEnd(lines, productStart, sharedRanges.map(r => r.start));
        productContent = lines.slice(productStart, productEnd).join("\n").trim();
      }
    } else if (productStart >= 0) {
      const productEnd = this._findSectionEnd(lines, productStart, sharedRanges.map(r => r.start));
      productContent = lines.slice(productStart, productEnd).join("\n").trim();
    } else {
      // Only dev found — unlikely but handle it
      const devEnd = this._findSectionEnd(lines, devStart, sharedRanges.map(r => r.start));
      devContent = lines.slice(devStart, devEnd).join("\n").trim();
      productContent = "";
    }

    // Prepend preamble to product
    if (preamble) {
      productContent = preamble + "\n\n" + productContent;
    }

    // Append shared to product
    if (shared) {
      productContent = productContent + "\n\n" + shared;
    }

    return { product: productContent.trim(), development: devContent, shared };
  }

  private _splitByKeywordMatch(
    lines: string[],
    sharedKeywords: string[]
  ): Omit<ConstitutionSplitResult, "strategy"> | null {
    let productStart = -1;
    let devStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^#{1,4}\s/.test(line)) {
        const headerText = line.replace(/^#{1,4}\s+/, "").toLowerCase();
        if (headerText.includes("product") && productStart === -1) {
          productStart = i;
        } else if (headerText.includes("development") && devStart === -1) {
          devStart = i;
        }
      }
    }

    if (productStart === -1 && devStart === -1) return null;

    // Simplified split — use the same H2 logic but with found indices
    const preamble = Math.min(
      ...[productStart, devStart].filter(i => i >= 0)
    );
    const preambleContent = preamble > 0 ? lines.slice(0, preamble).join("\n").trim() : "";

    let productContent = "";
    let devContent: string | null = null;

    if (productStart >= 0 && devStart >= 0) {
      if (productStart < devStart) {
        productContent = lines.slice(productStart, devStart).join("\n").trim();
        devContent = lines.slice(devStart).join("\n").trim();
      } else {
        devContent = lines.slice(devStart, productStart).join("\n").trim();
        productContent = lines.slice(productStart).join("\n").trim();
      }
    } else if (productStart >= 0) {
      productContent = lines.slice(productStart).join("\n").trim();
    } else {
      devContent = lines.slice(devStart).join("\n").trim();
    }

    if (preambleContent) {
      productContent = preambleContent + "\n\n" + productContent;
    }

    // Extract shared sections from the end of product content
    const shared = this._extractSharedSections(productContent, sharedKeywords);

    return { product: productContent.trim(), development: devContent, shared };
  }

  private _findSectionEnd(lines: string[], start: number, boundaries: number[]): number {
    const validBoundaries = boundaries.filter(b => b > start).sort((a, b) => a - b);
    return validBoundaries.length > 0 ? validBoundaries[0] : lines.length;
  }

  private _extractSharedSections(content: string, keywords: string[]): string {
    const lines = content.split("\n");
    const sharedParts: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^#{1,4}\s/.test(line)) {
        const headerText = line.replace(/^#{1,4}\s+/, "").toLowerCase();
        if (keywords.some(kw => headerText.includes(kw))) {
          // Collect until next heading of same or higher level
          const level = line.match(/^(#{1,4})\s/)![1].length;
          let end = lines.length;
          for (let j = i + 1; j < lines.length; j++) {
            const match = lines[j].trim().match(/^(#{1,4})\s/);
            if (match && match[1].length <= level) {
              end = j;
              break;
            }
          }
          sharedParts.push(lines.slice(i, end).join("\n"));
        }
      }
    }
    return sharedParts.join("\n\n").trim();
  }

  // ── Architecture Migration ───────────────────────────────────────────────

  /**
   * Replaces (NNN-slug) patterns in tech stack entries with (SPEC-XXX) using the mapping table.
   */
  reReferenceTechtackEntries(content: string, mappings: SpecMapping[]): string {
    // Build lookup: slug → primitivId
    const slugToId = new Map<string, string>();
    for (const m of mappings) {
      slugToId.set(m.original, m.primitivId);
    }

    // Match pattern: (NNN-slug) at end of line
    return content.replace(/\((\d+-[a-z0-9-]+)\)/g, (match, slug: string) => {
      const primitivId = slugToId.get(slug);
      return primitivId ? `(${primitivId})` : match;
    });
  }

  migrateArchitecture(mappings: SpecMapping[]): { migrated: boolean; skipped: boolean } {
    if (primitivFileExists(this.projectRoot, "constitutions", "architecture.md")) {
      return { migrated: false, skipped: true };
    }

    const claudeMdPath = join(this.projectRoot, "CLAUDE.md");
    if (!existsSync(claudeMdPath)) {
      return { migrated: false, skipped: false };
    }

    const rawContent = readFileSync(claudeMdPath, "utf-8");
    const reReferencedContent = this.reReferenceTechtackEntries(rawContent, mappings);

    const frontmatter = {
      type: "arch-constitution",
      version: 1,
      patterns: {},
      boundaries: [],
      adrs: [],
      updatedAt: new Date().toISOString(),
    };

    const serialized = serializeDocument(frontmatter, reReferencedContent);
    writePrimitivFile(this.projectRoot, ["constitutions", "architecture.md"], serialized);

    return { migrated: true, skipped: false };
  }

  // ── Constitution Migration ───────────────────────────────────────────────

  migrateConstitution(): { migrated: string[]; skipped: string[]; warnings: string[] } {
    const migrated: string[] = [];
    const skipped: string[] = [];
    const warnings: string[] = [];

    const constitutionPath = join(this.projectRoot, ".specify", "memory", "constitution.md");
    if (!existsSync(constitutionPath)) {
      warnings.push("No constitution.md found in .specify/memory/");
      return { migrated, skipped, warnings };
    }

    const rawContent = readFileSync(constitutionPath, "utf-8");

    // Strip any existing YAML frontmatter from the SpecKit constitution
    const { content } = matter(rawContent);
    const splitResult = this.splitConstitution(content);

    // Product constitution
    if (primitivFileExists(this.projectRoot, "constitutions", "product.md")) {
      skipped.push("product");
    } else {
      const productFrontmatter = {
        type: "product-constitution",
        version: 1,
        product: {
          name: "Migrated from SpecKit",
          targetUsers: [],
        },
        featureRegistry: [],
        updatedAt: new Date().toISOString(),
      };
      const productDoc = serializeDocument(productFrontmatter, splitResult.product);
      writePrimitivFile(this.projectRoot, ["constitutions", "product.md"], productDoc);
      migrated.push("product");
    }

    // Development constitution
    if (splitResult.development) {
      if (primitivFileExists(this.projectRoot, "constitutions", "development.md")) {
        skipped.push("development");
      } else {
        const devFrontmatter = {
          type: "dev-constitution",
          version: 1,
          stack: { languages: [], frameworks: [], databases: [], infrastructure: [] },
          conventions: { codeStyle: [], testing: [], documentation: [] },
          agentRules: [],
          updatedAt: new Date().toISOString(),
        };
        const devDoc = serializeDocument(devFrontmatter, splitResult.development);
        writePrimitivFile(this.projectRoot, ["constitutions", "development.md"], devDoc);
        migrated.push("development");
      }
    } else {
      warnings.push("No Development Principles section found in constitution.md — create manually via /primitiv.constitution development");
    }

    if (splitResult.strategy === "fallback") {
      warnings.push("Constitution split used fallback strategy — entire file mapped to product.md. Review for accuracy.");
    }

    return { migrated, skipped, warnings };
  }

  // ── Spec Migration ───────────────────────────────────────────────────────

  migrateSpec(
    specsDir: string,
    mapping: SpecMapping
  ): { migrated: boolean; artifacts: string[] } {
    const sourceDir = join(specsDir, mapping.original);
    const targetDirSegments = ["specs", mapping.primitivDir];

    // Check if already migrated
    if (primitivFileExists(this.projectRoot, ...targetDirSegments, "spec.md")) {
      return { migrated: false, artifacts: [] };
    }

    const artifacts: string[] = [];
    const now = new Date().toISOString();

    // spec.md — transform frontmatter
    const specPath = join(sourceDir, "spec.md");
    if (existsSync(specPath)) {
      const raw = readFileSync(specPath, "utf-8");
      const { data, content } = matter(raw);
      const primitivFrontmatter = {
        type: "spec",
        id: mapping.primitivId,
        title: (data.title as string) || mapping.slug.replace(/-/g, " "),
        status: "completed",
        version: 1,
        branch: `spec/${mapping.primitivDir}`,
        author: (data.author as string) || "migrated",
        createdAt: (data.createdAt as string) || now,
        updatedAt: now,
      };
      writePrimitivFile(
        this.projectRoot,
        [...targetDirSegments, "spec.md"],
        serializeDocument(primitivFrontmatter, content)
      );
      artifacts.push("spec.md");
    }

    // plan.md — transform frontmatter
    const planPath = join(sourceDir, "plan.md");
    if (existsSync(planPath)) {
      const raw = readFileSync(planPath, "utf-8");
      const { content } = matter(raw);
      const planFrontmatter = {
        type: "plan",
        version: 1,
        specId: mapping.primitivId,
        approach: "Migrated from SpecKit",
        fileChanges: [],
        risks: [],
        dependencies: [],
        updatedAt: now,
      };
      writePrimitivFile(
        this.projectRoot,
        [...targetDirSegments, "plan.md"],
        serializeDocument(planFrontmatter, content)
      );
      artifacts.push("plan.md");
    }

    // tasks.md — transform frontmatter
    const tasksPath = join(sourceDir, "tasks.md");
    if (existsSync(tasksPath)) {
      const raw = readFileSync(tasksPath, "utf-8");
      const { content } = matter(raw);
      const tasksFrontmatter = {
        type: "tasks",
        version: 1,
        specId: mapping.primitivId,
        tasks: [],
        updatedAt: now,
      };
      writePrimitivFile(
        this.projectRoot,
        [...targetDirSegments, "tasks.md"],
        serializeDocument(tasksFrontmatter, content)
      );
      artifacts.push("tasks.md");
    }

    // research.md — direct copy
    this._copyArtifact(sourceDir, targetDirSegments, "research.md", artifacts);

    // quickstart.md — direct copy
    this._copyArtifact(sourceDir, targetDirSegments, "quickstart.md", artifacts);

    // data-model.md → data-model/data-model.md
    const dataModelPath = join(sourceDir, "data-model.md");
    if (existsSync(dataModelPath)) {
      const content = readFileSync(dataModelPath, "utf-8");
      writePrimitivFile(
        this.projectRoot,
        [...targetDirSegments, "data-model", "data-model.md"],
        content
      );
      artifacts.push("data-model/data-model.md");
    }

    // checklists/ — recursive copy
    this._copyDirectory(sourceDir, targetDirSegments, "checklists", artifacts);

    // contracts/ — recursive copy
    this._copyDirectory(sourceDir, targetDirSegments, "contracts", artifacts);

    return { migrated: true, artifacts };
  }

  private _copyArtifact(
    sourceDir: string,
    targetSegments: string[],
    fileName: string,
    artifacts: string[]
  ): void {
    const sourcePath = join(sourceDir, fileName);
    if (existsSync(sourcePath)) {
      const content = readFileSync(sourcePath, "utf-8");
      writePrimitivFile(this.projectRoot, [...targetSegments, fileName], content);
      artifacts.push(fileName);
    }
  }

  private _copyDirectory(
    sourceDir: string,
    targetSegments: string[],
    dirName: string,
    artifacts: string[]
  ): void {
    const sourceDirPath = join(sourceDir, dirName);
    if (!existsSync(sourceDirPath)) return;

    const entries = readdirSync(sourceDirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const content = readFileSync(join(sourceDirPath, entry.name), "utf-8");
        writePrimitivFile(
          this.projectRoot,
          [...targetSegments, dirName, entry.name],
          content
        );
        artifacts.push(`${dirName}/${entry.name}`);
      }
    }
  }

  // ── State Management ─────────────────────────────────────────────────────

  updateState(specCount: number): void {
    const state = loadState(this.projectRoot);
    state.mode = "brownfield";
    state.nextSpecId = Math.max(state.nextSpecId, specCount + 1);
    saveState(this.projectRoot, state);
  }

  // ── Orchestration ────────────────────────────────────────────────────────

  migrate(): MigrationReport {
    const report: MigrationReport = {
      specsMigrated: [],
      specsSkipped: [],
      constitutionsMigrated: [],
      constitutionsSkipped: [],
      architectureMigrated: false,
      warnings: [],
      errors: [],
    };

    // 1. Detect
    const detection = this.detectSpecKit();
    if (!detection.found) {
      throw new MigrationNotFoundError();
    }

    // 2. Discover specs and build mapping
    const specDirs = detection.specsDir
      ? this.discoverSpecKitSpecs(detection.specsDir)
      : [];
    const mappings = this.buildSpecMapping(specDirs);

    // 3. Ensure .primitiv/ structure
    ensurePrimitivDir(this.projectRoot);

    // 4. Migrate constitution
    const constitutionResult = this.migrateConstitution();
    report.constitutionsMigrated = constitutionResult.migrated;
    report.constitutionsSkipped = constitutionResult.skipped;
    report.warnings.push(...constitutionResult.warnings);

    // 5. Migrate architecture
    const archResult = this.migrateArchitecture(mappings);
    report.architectureMigrated = archResult.migrated;
    if (archResult.skipped) {
      report.constitutionsSkipped.push("architecture");
    }

    // 6. Migrate specs
    for (const mapping of mappings) {
      if (!detection.specsDir) continue;
      const result = this.migrateSpec(detection.specsDir, mapping);
      if (result.migrated) {
        report.specsMigrated.push(mapping);
      } else {
        report.specsSkipped.push(mapping.original);
      }
    }

    // 7. Ensure gates directory with placeholder
    const gatesDir = join(getPrimitivRoot(this.projectRoot), "gates");
    if (!existsSync(gatesDir)) {
      mkdirSync(gatesDir, { recursive: true });
    }
    if (!primitivFileExists(this.projectRoot, "gates", "company-principles.md")) {
      report.warnings.push("Create company principles: /primitiv.company-principles");
    }
    if (!primitivFileExists(this.projectRoot, "gates", "security-principles.md")) {
      report.warnings.push("Create security principles: /primitiv.security-principles");
    }

    // 8. Update state
    this.updateState(mappings.length);

    return report;
  }
}
