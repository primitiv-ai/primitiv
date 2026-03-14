import { describe, it, expect } from "vitest";
import { parseDocument, serializeDocument } from "../src/utils/frontmatter.js";
import { CompanyPrinciplesFrontmatterSchema } from "../src/schemas/gates.js";
import { z } from "zod";

describe("frontmatter", () => {
  it("parses YAML frontmatter + markdown", () => {
    const raw = `---
type: company-principles
version: 1
company:
  name: "TestCo"
---

# Company Principles

Some content here.`;

    const result = parseDocument(raw, CompanyPrinciplesFrontmatterSchema);
    expect(result.data.type).toBe("company-principles");
    expect(result.data.company.name).toBe("TestCo");
    expect(result.content).toContain("Company Principles");
  });

  it("serializes data + content back to frontmatter", () => {
    const data = { type: "test", version: 1 };
    const content = "# Hello\n\nWorld";
    const result = serializeDocument(data, content);
    expect(result).toContain("---");
    expect(result).toContain("type: test");
    expect(result).toContain("# Hello");
  });

  it("throws on schema mismatch", () => {
    const raw = `---
type: wrong-type
version: 1
---
Content`;

    expect(() => parseDocument(raw, CompanyPrinciplesFrontmatterSchema)).toThrow();
  });
});
