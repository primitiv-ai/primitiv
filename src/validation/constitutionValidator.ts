import type { ConstitutionType } from "../schemas/common.js";
import { ConstitutionManager } from "../engine/ConstitutionManager.js";
import type { ValidationResult } from "./gateValidator.js";

export function validateConstitution(projectRoot: string, type: ConstitutionType): ValidationResult {
  const manager = new ConstitutionManager(projectRoot);
  const violations: string[] = [];
  const warnings: string[] = [];

  if (!manager.exists(type)) {
    violations.push(`${type} constitution not found. Generate it first.`);
    return { passed: false, gate: `constitution:${type}`, violations, warnings };
  }

  const doc = manager.get(type);

  if (!doc.content || doc.content.trim().length === 0) {
    warnings.push(`${type} constitution has no prose content.`);
  }

  return { passed: violations.length === 0, gate: `constitution:${type}`, violations, warnings };
}
