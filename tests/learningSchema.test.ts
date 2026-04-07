import { describe, it, expect } from "vitest";
import {
  LearningFrontmatterSchema,
  LearningTypeSchema,
  LearningSourceSchema,
  LearningSeveritySchema,
} from "../src/schemas/learning.js";

const validLearning = {
  type: "learning",
  id: "LEARN-001",
  learningType: "best-practice",
  title: "Always validate inputs",
  source: "user",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("LearningTypeSchema", () => {
  it("accepts valid learning types", () => {
    expect(LearningTypeSchema.parse("best-practice")).toBe("best-practice");
    expect(LearningTypeSchema.parse("error-resolution")).toBe("error-resolution");
    expect(LearningTypeSchema.parse("convention")).toBe("convention");
  });

  it("rejects invalid learning types", () => {
    expect(() => LearningTypeSchema.parse("invalid")).toThrow();
    expect(() => LearningTypeSchema.parse("tip")).toThrow();
  });
});

describe("LearningSourceSchema", () => {
  it("accepts valid sources", () => {
    expect(LearningSourceSchema.parse("user")).toBe("user");
    expect(LearningSourceSchema.parse("gate-failure")).toBe("gate-failure");
    expect(LearningSourceSchema.parse("test-failure")).toBe("test-failure");
    expect(LearningSourceSchema.parse("clarification")).toBe("clarification");
    expect(LearningSourceSchema.parse("review")).toBe("review");
  });

  it("rejects invalid sources", () => {
    expect(() => LearningSourceSchema.parse("invalid")).toThrow();
    expect(() => LearningSourceSchema.parse("system")).toThrow();
  });
});

describe("LearningSeveritySchema", () => {
  it("accepts valid severities", () => {
    expect(LearningSeveritySchema.parse("info")).toBe("info");
    expect(LearningSeveritySchema.parse("important")).toBe("important");
    expect(LearningSeveritySchema.parse("critical")).toBe("critical");
  });

  it("rejects invalid severities", () => {
    expect(() => LearningSeveritySchema.parse("invalid")).toThrow();
    expect(() => LearningSeveritySchema.parse("warning")).toThrow();
  });
});

describe("LearningFrontmatterSchema", () => {
  it("parses a valid learning record", () => {
    const result = LearningFrontmatterSchema.parse(validLearning);
    expect(result.type).toBe("learning");
    expect(result.id).toBe("LEARN-001");
    expect(result.learningType).toBe("best-practice");
    expect(result.title).toBe("Always validate inputs");
    expect(result.source).toBe("user");
    expect(result.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(result.updatedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("applies default values", () => {
    const result = LearningFrontmatterSchema.parse(validLearning);
    expect(result.version).toBe(1);
    expect(result.severity).toBe("info");
    expect(result.tags).toEqual([]);
    expect(result.specId).toBeNull();
    expect(result.author).toBe("system");
  });

  it("accepts explicit values overriding defaults", () => {
    const data = {
      ...validLearning,
      version: 2,
      severity: "critical",
      tags: ["auth", "security"],
      specId: "SPEC-001",
      author: "alice",
    };
    const result = LearningFrontmatterSchema.parse(data);
    expect(result.version).toBe(2);
    expect(result.severity).toBe("critical");
    expect(result.tags).toEqual(["auth", "security"]);
    expect(result.specId).toBe("SPEC-001");
    expect(result.author).toBe("alice");
  });

  it("rejects missing required field: id", () => {
    const { id, ...data } = validLearning;
    expect(() => LearningFrontmatterSchema.parse(data)).toThrow();
  });

  it("rejects missing required field: title", () => {
    const { title, ...data } = validLearning;
    expect(() => LearningFrontmatterSchema.parse(data)).toThrow();
  });

  it("rejects missing required field: learningType", () => {
    const { learningType, ...data } = validLearning;
    expect(() => LearningFrontmatterSchema.parse(data)).toThrow();
  });

  it("rejects missing required field: source", () => {
    const { source, ...data } = validLearning;
    expect(() => LearningFrontmatterSchema.parse(data)).toThrow();
  });

  it("rejects missing required field: createdAt", () => {
    const { createdAt, ...data } = validLearning;
    expect(() => LearningFrontmatterSchema.parse(data)).toThrow();
  });

  it("rejects invalid learningType", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, learningType: "tip" })
    ).toThrow();
  });

  it("rejects invalid source", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, source: "bot" })
    ).toThrow();
  });

  it("rejects invalid severity", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, severity: "warning" })
    ).toThrow();
  });

  it("validates ID format: LEARN-001 passes", () => {
    const result = LearningFrontmatterSchema.parse({ ...validLearning, id: "LEARN-001" });
    expect(result.id).toBe("LEARN-001");
  });

  it("validates ID format: LEARN-1 passes", () => {
    const result = LearningFrontmatterSchema.parse({ ...validLearning, id: "LEARN-1" });
    expect(result.id).toBe("LEARN-1");
  });

  it("validates ID format: LEARN-99999 passes", () => {
    const result = LearningFrontmatterSchema.parse({ ...validLearning, id: "LEARN-99999" });
    expect(result.id).toBe("LEARN-99999");
  });

  it("rejects invalid ID format: 'bad'", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, id: "bad" })
    ).toThrow();
  });

  it("rejects invalid ID format: 'LEARN-' (no digits)", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, id: "LEARN-" })
    ).toThrow();
  });

  it("rejects invalid ID format: 'SPEC-001'", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, id: "SPEC-001" })
    ).toThrow();
  });

  it("rejects empty title", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, title: "" })
    ).toThrow();
  });

  it("rejects invalid type literal", () => {
    expect(() =>
      LearningFrontmatterSchema.parse({ ...validLearning, type: "spec" })
    ).toThrow();
  });
});
