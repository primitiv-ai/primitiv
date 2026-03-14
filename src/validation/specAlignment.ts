import { validateGate } from "./gateValidator.js";
import { validateConstitution } from "./constitutionValidator.js";
import type { ValidationResult } from "./gateValidator.js";

export interface AlignmentReport {
  specId: string;
  gates: ValidationResult[];
  allPassed: boolean;
}

export function validateSpecAlignment(
  projectRoot: string,
  spec: { data: { id: string } }
): AlignmentReport {
  const results: ValidationResult[] = [
    validateGate(projectRoot, "company"),
    validateGate(projectRoot, "security"),
    validateConstitution(projectRoot, "product"),
    validateConstitution(projectRoot, "dev"),
    validateConstitution(projectRoot, "architecture"),
  ];

  return {
    specId: spec.data.id,
    gates: results,
    allPassed: results.every(r => r.passed),
  };
}
