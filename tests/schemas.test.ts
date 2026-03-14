import { describe, it, expect } from "vitest";
import { CompanyPrinciplesFrontmatterSchema, SecurityPrinciplesFrontmatterSchema } from "../src/schemas/gates.js";
import { ProductConstitutionFrontmatterSchema, DevConstitutionFrontmatterSchema, ArchConstitutionFrontmatterSchema } from "../src/schemas/constitution.js";
import { SpecFrontmatterSchema } from "../src/schemas/spec.js";
import { PlanFrontmatterSchema } from "../src/schemas/plan.js";
import { TasksFrontmatterSchema, TaskItemSchema } from "../src/schemas/task.js";
import { SpecStatusSchema, GateTypeSchema, ConstitutionTypeSchema } from "../src/schemas/common.js";
import { TestResultsFrontmatterSchema } from "../src/schemas/testResults.js";

describe("Common schemas", () => {
  it("validates spec statuses", () => {
    expect(SpecStatusSchema.parse("draft")).toBe("draft");
    expect(SpecStatusSchema.parse("tested")).toBe("tested");
    expect(SpecStatusSchema.parse("completed")).toBe("completed");
    expect(() => SpecStatusSchema.parse("invalid")).toThrow();
  });

  it("validates gate types", () => {
    expect(GateTypeSchema.parse("company")).toBe("company");
    expect(GateTypeSchema.parse("security")).toBe("security");
    expect(() => GateTypeSchema.parse("other")).toThrow();
  });

  it("validates constitution types", () => {
    expect(ConstitutionTypeSchema.parse("product")).toBe("product");
    expect(ConstitutionTypeSchema.parse("dev")).toBe("dev");
    expect(ConstitutionTypeSchema.parse("architecture")).toBe("architecture");
    expect(() => ConstitutionTypeSchema.parse("other")).toThrow();
  });
});

describe("Gate schemas", () => {
  it("parses company principles", () => {
    const data = {
      type: "company-principles",
      version: 1,
      company: { name: "Flowdesk", mission: "Market making", values: ["transparency"] },
      policies: { compliance: ["DORA"], legal: [], branding: [] },
      businessAlignment: { priorities: ["trading"], boundaries: ["B2B"] },
    };
    const result = CompanyPrinciplesFrontmatterSchema.parse(data);
    expect(result.company.name).toBe("Flowdesk");
    expect(result.policies.compliance).toContain("DORA");
  });

  it("applies defaults for company principles", () => {
    const data = {
      type: "company-principles",
      company: { name: "Test" },
    };
    const result = CompanyPrinciplesFrontmatterSchema.parse(data);
    expect(result.version).toBe(1);
    expect(result.policies.compliance).toEqual([]);
    expect(result.businessAlignment.priorities).toEqual([]);
  });

  it("parses security principles", () => {
    const data = {
      type: "security-principles",
      version: 1,
      policies: {
        authentication: ["OAuth2"],
        dataHandling: ["Encrypt at rest"],
        dependencies: [],
        networking: ["TLS 1.3"],
      },
      owaspAlignment: ["A01:2021"],
    };
    const result = SecurityPrinciplesFrontmatterSchema.parse(data);
    expect(result.policies.authentication).toContain("OAuth2");
  });
});

describe("Constitution schemas", () => {
  it("parses product constitution", () => {
    const data = {
      type: "product-constitution",
      product: { name: "TradingApp", domain: "finance", targetUsers: ["traders"], valueProposition: "Fast execution" },
    };
    const result = ProductConstitutionFrontmatterSchema.parse(data);
    expect(result.product.name).toBe("TradingApp");
    expect(result.featureRegistry).toEqual([]);
  });

  it("parses dev constitution", () => {
    const data = {
      type: "dev-constitution",
      stack: { languages: ["TypeScript"], frameworks: ["Next.js"], databases: ["PostgreSQL"], infrastructure: ["AWS"] },
    };
    const result = DevConstitutionFrontmatterSchema.parse(data);
    expect(result.stack.languages).toContain("TypeScript");
    expect(result.conventions.codeStyle).toEqual([]);
  });

  it("parses arch constitution", () => {
    const data = {
      type: "arch-constitution",
      patterns: { style: "microservices", communication: "event-driven" },
    };
    const result = ArchConstitutionFrontmatterSchema.parse(data);
    expect(result.patterns.style).toBe("microservices");
    expect(result.boundaries).toEqual([]);
  });
});

describe("Spec schema", () => {
  it("parses spec frontmatter", () => {
    const data = {
      type: "spec",
      id: "SPEC-001",
      title: "User Auth",
      status: "draft",
    };
    const result = SpecFrontmatterSchema.parse(data);
    expect(result.id).toBe("SPEC-001");
    expect(result.status).toBe("draft");
    expect(result.version).toBe(1);
  });

  it("rejects invalid status", () => {
    expect(() => SpecFrontmatterSchema.parse({
      type: "spec",
      id: "SPEC-001",
      title: "Test",
      status: "invalid",
    })).toThrow();
  });
});

describe("Plan schema", () => {
  it("parses plan frontmatter", () => {
    const data = {
      type: "plan",
      specId: "SPEC-001",
      approach: "Build auth module",
      fileChanges: [{ path: "src/auth.ts", action: "create", description: "Auth module" }],
    };
    const result = PlanFrontmatterSchema.parse(data);
    expect(result.specId).toBe("SPEC-001");
    expect(result.fileChanges).toHaveLength(1);
  });
});

describe("Task schema", () => {
  it("parses task item", () => {
    const data = {
      id: "TASK-001",
      title: "Create auth module",
      status: "pending",
      files: ["src/auth.ts"],
      acceptanceCriteria: ["Module exports authenticate()"],
    };
    const result = TaskItemSchema.parse(data);
    expect(result.id).toBe("TASK-001");
    expect(result.status).toBe("pending");
    expect(result.dependsOn).toEqual([]);
  });

  it("parses task item with dependsOn", () => {
    const data = {
      id: "TASK-003",
      title: "Create auth middleware",
      status: "pending",
      files: ["src/middleware/auth.ts"],
      acceptanceCriteria: ["Middleware validates JWT"],
      dependsOn: ["TASK-001", "TASK-002"],
    };
    const result = TaskItemSchema.parse(data);
    expect(result.dependsOn).toEqual(["TASK-001", "TASK-002"]);
  });

  it("parses tasks frontmatter", () => {
    const data = {
      type: "tasks",
      specId: "SPEC-001",
      tasks: [
        { id: "TASK-001", title: "First task", status: "pending", files: [], acceptanceCriteria: [] },
      ],
    };
    const result = TasksFrontmatterSchema.parse(data);
    expect(result.tasks).toHaveLength(1);
  });

  it("parses tasks frontmatter with dependencies", () => {
    const data = {
      type: "tasks",
      specId: "SPEC-001",
      tasks: [
        { id: "TASK-001", title: "Create models", status: "pending", files: ["src/models.ts"], acceptanceCriteria: [], dependsOn: [] },
        { id: "TASK-002", title: "Create API", status: "pending", files: ["src/api.ts"], acceptanceCriteria: [], dependsOn: [] },
        { id: "TASK-003", title: "Integrate", status: "pending", files: ["src/app.ts"], acceptanceCriteria: [], dependsOn: ["TASK-001", "TASK-002"] },
      ],
    };
    const result = TasksFrontmatterSchema.parse(data);
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].dependsOn).toEqual([]);
    expect(result.tasks[1].dependsOn).toEqual([]);
    expect(result.tasks[2].dependsOn).toEqual(["TASK-001", "TASK-002"]);
  });
});

describe("TestResults schema", () => {
  it("parses test results frontmatter", () => {
    const data = {
      type: "test-results",
      specId: "SPEC-001",
      testTypes: ["unit", "integration"],
      summary: { total: 10, passed: 8, failed: 1, skipped: 1 },
    };
    const result = TestResultsFrontmatterSchema.parse(data);
    expect(result.specId).toBe("SPEC-001");
    expect(result.testTypes).toEqual(["unit", "integration"]);
    expect(result.summary.total).toBe(10);
    expect(result.summary.passed).toBe(8);
    expect(result.summary.failed).toBe(1);
  });

  it("applies defaults for test results", () => {
    const data = {
      type: "test-results",
      specId: "SPEC-002",
    };
    const result = TestResultsFrontmatterSchema.parse(data);
    expect(result.version).toBe(1);
    expect(result.testTypes).toEqual([]);
    expect(result.summary.total).toBe(0);
    expect(result.summary.passed).toBe(0);
  });

  it("validates test types", () => {
    const data = {
      type: "test-results",
      specId: "SPEC-001",
      testTypes: ["ui", "api", "unit", "integration"],
    };
    const result = TestResultsFrontmatterSchema.parse(data);
    expect(result.testTypes).toHaveLength(4);
  });

  it("rejects invalid test types", () => {
    expect(() => TestResultsFrontmatterSchema.parse({
      type: "test-results",
      specId: "SPEC-001",
      testTypes: ["invalid"],
    })).toThrow();
  });
});
