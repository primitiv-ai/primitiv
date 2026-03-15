// SDK exports
export { PrimitivEngine } from "./engine/PrimitivEngine.js";
export { GateManager } from "./engine/GateManager.js";
export { ConstitutionManager } from "./engine/ConstitutionManager.js";
export { SpecManager } from "./engine/SpecManager.js";
export { FeatureRegistryManager } from "./engine/FeatureRegistryManager.js";
export { AuditManager } from "./engine/AuditManager.js";
export { ResearchManager } from "./engine/ResearchManager.js";
export { ContractManager } from "./engine/ContractManager.js";

// Schemas
export * from "./schemas/common.js";
export * from "./schemas/gates.js";
export * from "./schemas/constitution.js";
export * from "./schemas/spec.js";
export * from "./schemas/plan.js";
export * from "./schemas/task.js";
export * from "./schemas/testResults.js";
export * from "./schemas/audit.js";
export * from "./schemas/research.js";

// State machine
export { canTransition, assertTransition, getNextStatuses, isTerminal } from "./state/specStateMachine.js";

// Validation
export { validateGate, assertGateValid } from "./validation/gateValidator.js";
export { validateConstitution } from "./validation/constitutionValidator.js";
export { validateSpecAlignment } from "./validation/specAlignment.js";
export { validateTaskDependencies } from "./validation/taskValidator.js";

// Git
export { assertGitRepo, isGitRepo, getGitRoot } from "./git/gitGuard.js";
export { createSpecBranch, isOnSpecBranch, getSpecIdFromBranch, detectDefaultBranch } from "./git/branching.js";

// Utils
export { parseDocument, serializeDocument } from "./utils/frontmatter.js";
export { PrimitivError, GitNotFoundError, NotInitializedError, SpecNotFoundError } from "./utils/errors.js";
