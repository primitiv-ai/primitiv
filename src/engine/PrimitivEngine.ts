import { assertGitRepo } from "../git/gitGuard.js";
import { isPrimitivInitialized } from "../utils/fileSystem.js";
import { NotInitializedError } from "../utils/errors.js";
import { GateManager } from "./GateManager.js";
import { ConstitutionManager } from "./ConstitutionManager.js";
import { SpecManager } from "./SpecManager.js";
import { FeatureRegistryManager } from "./FeatureRegistryManager.js";
import { AuditManager } from "./AuditManager.js";
import { ResearchManager } from "./ResearchManager.js";
import { ContractManager } from "./ContractManager.js";
import { validateGate } from "../validation/gateValidator.js";
import { validateConstitution } from "../validation/constitutionValidator.js";
import { validateSpecAlignment } from "../validation/specAlignment.js";
import type { GateType, ConstitutionType, SpecStatus } from "../schemas/common.js";
import type { ValidationResult } from "../validation/gateValidator.js";
import type { AlignmentReport } from "../validation/specAlignment.js";

export class PrimitivEngine {
  public readonly gates: GateManager;
  public readonly constitutions: ConstitutionManager;
  public readonly specs: SpecManager;
  public readonly features: FeatureRegistryManager;
  public readonly audit: AuditManager;
  public readonly research: ResearchManager;
  public readonly contracts: ContractManager;

  private constructor(public readonly projectRoot: string) {
    this.gates = new GateManager(projectRoot);
    this.constitutions = new ConstitutionManager(projectRoot);
    this.specs = new SpecManager(projectRoot);
    this.features = new FeatureRegistryManager(projectRoot);
    this.audit = new AuditManager(projectRoot);
    this.research = new ResearchManager(projectRoot);
    this.contracts = new ContractManager(projectRoot);
    this.specs.setAuditManager(this.audit);
  }

  static load(projectRoot: string): PrimitivEngine {
    assertGitRepo(projectRoot);
    if (!isPrimitivInitialized(projectRoot)) {
      throw new NotInitializedError();
    }
    return new PrimitivEngine(projectRoot);
  }

  // Gates
  getGate(gate: GateType) {
    return this.gates.getGate(gate);
  }

  validateGate(gate: GateType): ValidationResult {
    return validateGate(this.projectRoot, gate);
  }

  // Constitutions
  getConstitution(type: ConstitutionType) {
    return this.constitutions.get(type);
  }

  validateConstitution(type: ConstitutionType): ValidationResult {
    return validateConstitution(this.projectRoot, type);
  }

  // Specs
  createSpec(opts: { title: string; description: string; branch?: string; author?: string }) {
    return this.specs.create(opts.title, opts.description, opts.branch, opts.author);
  }

  getSpec(specId: string) {
    return this.specs.get(specId);
  }

  listSpecs(filter?: { status?: SpecStatus }) {
    return this.specs.list(filter);
  }

  validateSpecGates(specId: string): AlignmentReport {
    const spec = this.specs.get(specId);
    return validateSpecAlignment(this.projectRoot, spec);
  }

  getSpecGraph(specId: string) {
    return this.specs.getSpecGraph(specId);
  }

  // Full context
  getProjectContext(): Record<string, unknown> {
    const context: Record<string, unknown> = {};

    try { context.companyPrinciples = this.gates.getCompanyPrinciples(); } catch { /* not set */ }
    try { context.securityPrinciples = this.gates.getSecurityPrinciples(); } catch { /* not set */ }
    try { context.productConstitution = this.constitutions.get("product"); } catch { /* not set */ }
    try { context.devConstitution = this.constitutions.get("dev"); } catch { /* not set */ }
    try { context.archConstitution = this.constitutions.get("architecture"); } catch { /* not set */ }

    context.specs = this.specs.list();

    return context;
  }
}
