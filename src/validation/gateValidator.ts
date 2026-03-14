import type { GateType } from "../schemas/common.js";
import { GateManager } from "../engine/GateManager.js";
import { GateValidationError } from "../utils/errors.js";

export interface ValidationResult {
  passed: boolean;
  gate: string;
  violations: string[];
  warnings: string[];
}

export function validateGate(projectRoot: string, gate: GateType): ValidationResult {
  const manager = new GateManager(projectRoot);
  const violations: string[] = [];
  const warnings: string[] = [];

  if (!manager.exists(gate)) {
    violations.push(`${gate} principles not found. Generate them first.`);
    return { passed: false, gate, violations, warnings };
  }

  const doc = manager.getGate(gate);

  // Basic structural validation
  if (!doc.content || doc.content.trim().length === 0) {
    warnings.push(`${gate} principles have no prose content.`);
  }

  if (gate === "company") {
    const data = doc.data as { company?: { name?: string } };
    if (!data.company?.name) {
      violations.push("Company name is required in company principles.");
    }
  }

  if (gate === "security") {
    const data = doc.data as { policies?: Record<string, unknown[]> };
    const policies = data.policies ?? {};
    const hasAnyPolicy = Object.values(policies).some(arr => Array.isArray(arr) && arr.length > 0);
    if (!hasAnyPolicy) {
      warnings.push("Security principles have no specific policies defined.");
    }
  }

  return { passed: violations.length === 0, gate, violations, warnings };
}

export function assertGateValid(projectRoot: string, gate: GateType): void {
  const result = validateGate(projectRoot, gate);
  if (!result.passed) {
    throw new GateValidationError(gate, result.violations);
  }
}
