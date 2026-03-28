import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GateManager } from "./GateManager.js";
import { ConstitutionManager } from "./ConstitutionManager.js";
import { GovernanceContextSchema } from "../schemas/governance.js";
import type { GovernanceContext, CompilationWarning } from "../schemas/governance.js";
import { getPrimitivRoot, writePrimitivFile } from "../utils/fileSystem.js";
import { GovernanceCompilationError } from "../utils/errors.js";

export const COMPILER_VERSION = "1.0";

const CONTEXT_FILENAME = "governance-context.json";
const PRIMITIV_GITIGNORE = ".gitignore";

const GOVERNANCE_FILES = [
  "constitutions/architecture.md",
  "constitutions/development.md",
  "constitutions/product.md",
  "gates/company-principles.md",
  "gates/security-principles.md",
] as const;

export class GovernanceCompiler {
  private readonly gates: GateManager;
  private readonly constitutions: ConstitutionManager;

  constructor(private readonly projectRoot: string) {
    this.gates = new GateManager(projectRoot);
    this.constitutions = new ConstitutionManager(projectRoot);
  }

  compile(): GovernanceContext {
    const warnings: CompilationWarning[] = [];

    const company = this.tryLoadSection(
      () => this.gates.getCompanyPrinciples().data,
      "gates/company-principles.md",
      "company",
      warnings
    );

    const security = this.tryLoadSection(
      () => this.gates.getSecurityPrinciples().data,
      "gates/security-principles.md",
      "security",
      warnings
    );

    const product = this.tryLoadSection(
      () => this.constitutions.get("product").data,
      "constitutions/product.md",
      "product",
      warnings
    );

    const development = this.tryLoadSection(
      () => this.constitutions.get("dev").data,
      "constitutions/development.md",
      "development",
      warnings
    );

    const architecture = this.tryLoadSection(
      () => this.constitutions.get("architecture").data,
      "constitutions/architecture.md",
      "architecture",
      warnings
    );

    const sourceHash = this.computeSourceHash();

    return {
      version: COMPILER_VERSION,
      compiledAt: new Date().toISOString(),
      sourceHash,
      company: company ?? null,
      security: security ?? null,
      product: product ?? null,
      development: development ?? null,
      architecture: architecture ?? null,
      warnings,
    };
  }

  readCached(): GovernanceContext | null {
    const contextPath = this.contextFilePath();
    if (!existsSync(contextPath)) return null;

    try {
      const raw = readFileSync(contextPath, "utf-8");
      const parsed = GovernanceContextSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  isStale(cached: GovernanceContext): boolean {
    if (cached.version !== COMPILER_VERSION) return true;
    return cached.sourceHash !== this.computeSourceHash();
  }

  write(context: GovernanceContext): void {
    writePrimitivFile(
      this.projectRoot,
      [CONTEXT_FILENAME],
      JSON.stringify(context, null, 2)
    );
    this.ensureGitignored();
  }

  private tryLoadSection<T>(
    loader: () => T,
    source: string,
    sectionName: string,
    warnings: CompilationWarning[]
  ): T | undefined {
    try {
      return loader();
    } catch (err) {
      const isNotFound =
        err instanceof Error &&
        (err.message.includes("not found") || err.message.includes("ENOENT"));

      if (isNotFound) {
        warnings.push({
          level: "warn",
          message: `${sectionName} governance not found — section will be null in compiled context`,
          source,
        });
        return undefined;
      }

      // Malformed YAML or schema validation error
      const detail = err instanceof Error ? err.message : String(err);
      throw new GovernanceCompilationError(source, detail);
    }
  }

  private computeSourceHash(): string {
    const primitiveRoot = getPrimitivRoot(this.projectRoot);
    const hash = createHash("sha256");

    for (const relPath of GOVERNANCE_FILES) {
      const fullPath = join(primitiveRoot, relPath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, "utf-8");
        hash.update(relPath);
        hash.update(content);
      }
    }

    return hash.digest("hex");
  }

  private contextFilePath(): string {
    return join(getPrimitivRoot(this.projectRoot), CONTEXT_FILENAME);
  }

  private ensureGitignored(): void {
    const gitignorePath = join(getPrimitivRoot(this.projectRoot), PRIMITIV_GITIGNORE);
    const entry = "governance-context.json";

    if (!existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, `${entry}\n`);
      return;
    }

    const content = readFileSync(gitignorePath, "utf-8");
    if (content.split("\n").map(l => l.trim()).includes(entry)) return;

    const separator = content.endsWith("\n") ? "" : "\n";
    writeFileSync(gitignorePath, `${content}${separator}${entry}\n`);
  }
}

export interface EnsureGovernanceContextResult {
  context: GovernanceContext;
  recompiled: boolean;
  notices: string[];
}

export function ensureGovernanceContext(projectRoot: string): EnsureGovernanceContextResult {
  const compiler = new GovernanceCompiler(projectRoot);
  const cached = compiler.readCached();

  if (!cached) {
    const context = compiler.compile();
    compiler.write(context);
    return { context, recompiled: false, notices: [] };
  }

  if (cached.version !== COMPILER_VERSION) {
    const notice = `⟳ Governance context schema updated (v${cached.version} → v${COMPILER_VERSION}), recompiling...`;
    const context = compiler.compile();
    compiler.write(context);
    return { context, recompiled: true, notices: [notice] };
  }

  if (compiler.isStale(cached)) {
    const notice = "⟳ Governance files changed, recompiling context...";
    const context = compiler.compile();
    compiler.write(context);
    return { context, recompiled: true, notices: [notice] };
  }

  return { context: cached, recompiled: false, notices: [] };
}
