import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateGate, assertGateValid } from "../src/validation/gateValidator.js";
import { validateConstitution } from "../src/validation/constitutionValidator.js";
import { validateSpecAlignment } from "../src/validation/specAlignment.js";
import { writePrimitivFile } from "../src/utils/fileSystem.js";
import { serializeDocument } from "../src/utils/frontmatter.js";
import { GateValidationError } from "../src/utils/errors.js";

describe("Gate validation", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `primitiv-gate-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(testDir, ".primitiv", "gates"), { recursive: true });
    mkdirSync(join(testDir, ".primitiv", "constitutions"), { recursive: true });
    mkdirSync(join(testDir, ".primitiv", "specs"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("validateGate — company", () => {
    it("fails when company principles file is missing", () => {
      const result = validateGate(testDir, "company");
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain("not found");
    });

    it("passes when company principles exist with required fields", () => {
      const data = {
        type: "company-principles",
        version: 1,
        company: { name: "Primitiv", mission: "SDD", values: ["quality"] },
        policies: { compliance: [], legal: [], branding: [] },
        businessAlignment: { priorities: [], boundaries: [] },
      };
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(data, "# Company Principles\n\nOur principles."));
      const result = validateGate(testDir, "company");
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("throws when company principles have invalid schema (missing company name)", () => {
      const data = {
        type: "company-principles",
        version: 1,
        company: { mission: "SDD", values: [] },
        policies: { compliance: [], legal: [], branding: [] },
        businessAlignment: { priorities: [], boundaries: [] },
      };
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(data, "# Company"));
      // Zod validation rejects the missing required 'name' field during parsing
      expect(() => validateGate(testDir, "company")).toThrow();
    });

    it("warns when company principles have no prose content", () => {
      const data = {
        type: "company-principles",
        version: 1,
        company: { name: "Primitiv", mission: "SDD", values: [] },
        policies: { compliance: [], legal: [], branding: [] },
        businessAlignment: { priorities: [], boundaries: [] },
      };
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(data, ""));
      const result = validateGate(testDir, "company");
      expect(result.passed).toBe(true); // Warnings don't block
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("validateGate — security", () => {
    it("fails when security principles file is missing", () => {
      const result = validateGate(testDir, "security");
      expect(result.passed).toBe(false);
    });

    it("passes with valid security principles", () => {
      const data = {
        type: "security-principles",
        version: 1,
        policies: {
          authentication: ["OAuth2"],
          dataHandling: ["Encrypt at rest"],
          dependencies: [],
          networking: ["TLS"],
        },
        owaspAlignment: [],
      };
      writePrimitivFile(testDir, ["gates", "security-principles.md"], serializeDocument(data, "# Security\n\nPolicies."));
      const result = validateGate(testDir, "security");
      expect(result.passed).toBe(true);
    });

    it("warns when no policies are defined", () => {
      const data = {
        type: "security-principles",
        version: 1,
        policies: {
          authentication: [],
          dataHandling: [],
          dependencies: [],
          networking: [],
        },
        owaspAlignment: [],
      };
      writePrimitivFile(testDir, ["gates", "security-principles.md"], serializeDocument(data, "# Security\n\nEmpty policies."));
      const result = validateGate(testDir, "security");
      expect(result.passed).toBe(true); // Warnings don't block
      expect(result.warnings.some(w => w.includes("no specific policies"))).toBe(true);
    });
  });

  describe("assertGateValid", () => {
    it("throws GateValidationError when gate validation fails", () => {
      expect(() => assertGateValid(testDir, "company")).toThrow(GateValidationError);
    });

    it("does not throw when gate is valid", () => {
      const data = {
        type: "company-principles",
        version: 1,
        company: { name: "Primitiv" },
        policies: { compliance: [], legal: [], branding: [] },
        businessAlignment: { priorities: [], boundaries: [] },
      };
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(data, "# Company\n\nPrinciples."));
      expect(() => assertGateValid(testDir, "company")).not.toThrow();
    });
  });

  describe("validateConstitution", () => {
    it("fails when constitution file is missing", () => {
      const result = validateConstitution(testDir, "product");
      expect(result.passed).toBe(false);
      expect(result.violations[0]).toContain("not found");
    });

    it("passes when constitution exists with content", () => {
      const data = {
        type: "product-constitution",
        version: 1,
        product: { name: "Primitiv", domain: "dev-tools", targetUsers: ["devs"], valueProposition: "SDD" },
        featureRegistry: [],
      };
      writePrimitivFile(testDir, ["constitutions", "product.md"], serializeDocument(data, "# Product Constitution\n\nDefines the product."));
      const result = validateConstitution(testDir, "product");
      expect(result.passed).toBe(true);
    });

    it("warns when constitution has no prose content", () => {
      const data = {
        type: "dev-constitution",
        version: 1,
        stack: { languages: ["TypeScript"], frameworks: [], databases: [], infrastructure: [] },
        conventions: { codeStyle: [], testing: [], documentation: [] },
      };
      writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(data, ""));
      const result = validateConstitution(testDir, "dev");
      expect(result.passed).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("validateSpecAlignment", () => {
    it("returns alignment report with all gate results", () => {
      const spec = { data: { id: "SPEC-001" } };
      const report = validateSpecAlignment(testDir, spec);
      expect(report.specId).toBe("SPEC-001");
      expect(report.gates).toHaveLength(5); // 2 gates + 3 constitutions
    });

    it("reports allPassed=false when gates are missing", () => {
      const spec = { data: { id: "SPEC-001" } };
      const report = validateSpecAlignment(testDir, spec);
      expect(report.allPassed).toBe(false);
    });

    it("reports allPassed=true when all gates and constitutions exist", () => {
      // Create all gate files
      const companyData = {
        type: "company-principles",
        version: 1,
        company: { name: "Primitiv" },
        policies: { compliance: [], legal: [], branding: [] },
        businessAlignment: { priorities: [], boundaries: [] },
      };
      writePrimitivFile(testDir, ["gates", "company-principles.md"], serializeDocument(companyData, "# Company\n\nPrinciples."));

      const securityData = {
        type: "security-principles",
        version: 1,
        policies: { authentication: ["OAuth2"], dataHandling: [], dependencies: [], networking: [] },
        owaspAlignment: [],
      };
      writePrimitivFile(testDir, ["gates", "security-principles.md"], serializeDocument(securityData, "# Security\n\nPolicies."));

      // Create all constitution files
      const productData = {
        type: "product-constitution",
        version: 1,
        product: { name: "Primitiv", domain: "dev", targetUsers: ["devs"], valueProposition: "SDD" },
        featureRegistry: [],
      };
      writePrimitivFile(testDir, ["constitutions", "product.md"], serializeDocument(productData, "# Product\n\nConstitution."));

      const devData = {
        type: "dev-constitution",
        version: 1,
        stack: { languages: ["TypeScript"], frameworks: [], databases: [], infrastructure: [] },
        conventions: { codeStyle: [], testing: [], documentation: [] },
      };
      writePrimitivFile(testDir, ["constitutions", "development.md"], serializeDocument(devData, "# Dev\n\nConstitution."));

      const archData = {
        type: "arch-constitution",
        version: 1,
        patterns: { style: "monolith" },
        boundaries: [],
      };
      writePrimitivFile(testDir, ["constitutions", "architecture.md"], serializeDocument(archData, "# Arch\n\nConstitution."));

      const spec = { data: { id: "SPEC-001" } };
      const report = validateSpecAlignment(testDir, spec);
      expect(report.allPassed).toBe(true);
      expect(report.gates.every(g => g.passed)).toBe(true);
    });
  });
});
