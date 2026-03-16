export class PrimitivError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "PrimitivError";
  }
}

export class GitNotFoundError extends PrimitivError {
  constructor() {
    super("Not a git repository. Run 'git init' first.", "GIT_NOT_FOUND");
  }
}

export class NotInitializedError extends PrimitivError {
  constructor() {
    super("Primitiv not initialized. Run 'primitiv init .' first.", "NOT_INITIALIZED");
  }
}

export class GateNotFoundError extends PrimitivError {
  constructor(gate: string) {
    super(`Gate '${gate}' not found. Generate it first.`, "GATE_NOT_FOUND");
  }
}

export class ConstitutionNotFoundError extends PrimitivError {
  constructor(type: string) {
    super(`Constitution '${type}' not found. Generate it first.`, "CONSTITUTION_NOT_FOUND");
  }
}

export class SpecNotFoundError extends PrimitivError {
  constructor(specId: string) {
    super(`Spec '${specId}' not found.`, "SPEC_NOT_FOUND");
  }
}

export class InvalidTransitionError extends PrimitivError {
  constructor(from: string, to: string) {
    super(`Invalid status transition: ${from} → ${to}`, "INVALID_TRANSITION");
  }
}

export class MigrationNotFoundError extends PrimitivError {
  constructor() {
    super(
      "No SpecKit project detected. Expected .specify/ directory and/or specs/ folder at the project root.",
      "MIGRATION_NOT_FOUND"
    );
  }
}

export class GateValidationError extends PrimitivError {
  violations: string[];

  constructor(gate: string, violations: string[]) {
    super(
      `Gate '${gate}' validation failed:\n${violations.map(v => `  - ${v}`).join("\n")}`,
      "GATE_VALIDATION_FAILED"
    );
    this.violations = violations;
  }
}
