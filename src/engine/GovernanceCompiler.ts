import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GateManager } from "./GateManager.js";
import { ConstitutionManager } from "./ConstitutionManager.js";
import { GovernanceContextSchema } from "../schemas/governance.js";
import type { GovernanceContext, CompilationWarning, NormalizedConstraints, NormalizedConstraint } from "../schemas/governance.js";
import type { DevConstitutionFrontmatter } from "../schemas/constitution.js";
import type { ArchConstitutionFrontmatter } from "../schemas/constitution.js";
import type { SecurityPrinciplesFrontmatter } from "../schemas/gates.js";
import { getPrimitivRoot, writePrimitivFile } from "../utils/fileSystem.js";
import { GovernanceCompilationError } from "../utils/errors.js";

export const COMPILER_VERSION = "1.1";

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
    const constraints = this.deriveConstraints(development, architecture, security);

    return {
      version: COMPILER_VERSION,
      compiledAt: new Date().toISOString(),
      sourceHash,
      company: company ?? null,
      security: security ?? null,
      product: product ?? null,
      development: development ?? null,
      architecture: architecture ?? null,
      constraints,
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

  private deriveConstraints(
    development: DevConstitutionFrontmatter | null | undefined,
    architecture: ArchConstitutionFrontmatter | null | undefined,
    security: SecurityPrinciplesFrontmatter | null | undefined
  ): NormalizedConstraints {
    const raw: NormalizedConstraint[] = [];

    if (development) {
      const { languages, frameworks, databases, infrastructure } = development.stack;
      for (const rule of [...languages, ...frameworks, ...databases, ...infrastructure]) {
        raw.push({ category: "tech", rule, source: "development.stack" });
      }
      for (const rule of development.agentRules) {
        raw.push({ category: "code", rule, source: "development.agentRules" });
      }
      for (const rule of development.conventions.codeStyle) {
        raw.push({ category: "code", rule, source: "development.conventions.codeStyle" });
      }
    }

    if (architecture) {
      const { style, communication, dataFlow } = architecture.patterns;
      if (style) raw.push({ category: "architecture", rule: style, source: "architecture.patterns.style" });
      if (communication) raw.push({ category: "architecture", rule: communication, source: "architecture.patterns.communication" });
      if (dataFlow) raw.push({ category: "architecture", rule: dataFlow, source: "architecture.patterns.dataFlow" });
      for (const b of architecture.boundaries) {
        raw.push({ category: "architecture", rule: b.name, source: "architecture.boundaries" });
      }
    }

    if (security) {
      for (const rule of security.policies.authentication) {
        raw.push({ category: "security", rule, source: "security.policies.authentication" });
      }
      for (const rule of security.policies.dataHandling) {
        raw.push({ category: "security", rule, source: "security.policies.dataHandling" });
      }
      for (const rule of security.policies.networking) {
        raw.push({ category: "security", rule, source: "security.policies.networking" });
      }
      for (const rule of security.owaspAlignment) {
        raw.push({ category: "security", rule, source: "security.owaspAlignment" });
      }
    }

    // Deduplicate by rule within each category (keep first occurrence)
    const seen = new Set<string>();
    const deduped = raw.filter(c => {
      const key = `${c.category}:${c.rule}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: category alphabetically, then rule alphabetically within category
    deduped.sort((a, b) => a.category.localeCompare(b.category) || a.rule.localeCompare(b.rule));

    return {
      tech: deduped.filter(c => c.category === "tech"),
      code: deduped.filter(c => c.category === "code"),
      architecture: deduped.filter(c => c.category === "architecture"),
      security: deduped.filter(c => c.category === "security"),
    };
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
