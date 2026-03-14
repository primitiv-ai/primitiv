import { describe, it, expect } from "vitest";
import {
  PrimitivError,
  GitNotFoundError,
  NotInitializedError,
  GateNotFoundError,
  ConstitutionNotFoundError,
  SpecNotFoundError,
  InvalidTransitionError,
  GateValidationError,
} from "../src/utils/errors.js";

describe("errors", () => {
  it("PrimitivError has code", () => {
    const err = new PrimitivError("test", "TEST_CODE");
    expect(err.code).toBe("TEST_CODE");
    expect(err.message).toBe("test");
    expect(err.name).toBe("PrimitivError");
  });

  it("GitNotFoundError has correct message and code", () => {
    const err = new GitNotFoundError();
    expect(err.code).toBe("GIT_NOT_FOUND");
    expect(err.message).toContain("git");
  });

  it("NotInitializedError has correct code", () => {
    const err = new NotInitializedError();
    expect(err.code).toBe("NOT_INITIALIZED");
  });

  it("GateNotFoundError includes gate name", () => {
    const err = new GateNotFoundError("company");
    expect(err.message).toContain("company");
    expect(err.code).toBe("GATE_NOT_FOUND");
  });

  it("ConstitutionNotFoundError includes type", () => {
    const err = new ConstitutionNotFoundError("product");
    expect(err.message).toContain("product");
  });

  it("SpecNotFoundError includes specId", () => {
    const err = new SpecNotFoundError("SPEC-001");
    expect(err.message).toContain("SPEC-001");
  });

  it("InvalidTransitionError includes from/to", () => {
    const err = new InvalidTransitionError("draft", "completed");
    expect(err.message).toContain("draft");
    expect(err.message).toContain("completed");
  });

  it("GateValidationError has violations", () => {
    const err = new GateValidationError("company", ["Missing name", "Missing mission"]);
    expect(err.violations).toHaveLength(2);
    expect(err.message).toContain("Missing name");
  });
});
