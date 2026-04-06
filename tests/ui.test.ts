import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderCompactBanner, getVersion } from "../src/ui/banner.js";
import { renderBox } from "../src/ui/box.js";

describe("UI Components", () => {
  describe("Banner", () => {
    describe("renderCompactBanner", () => {
      it("contains the word Primitiv", () => {
        const result = renderCompactBanner();
        expect(result).toContain("Primitiv");
      });

      it("contains the version number", () => {
        const version = getVersion();
        const result = renderCompactBanner();
        expect(result).toContain(version);
      });

      it("starts with the diamond symbol", () => {
        const result = renderCompactBanner();
        expect(result).toContain("◆");
      });
    });

    describe("renderCompactBanner (NO_COLOR)", () => {
      beforeEach(() => {
        process.env["NO_COLOR"] = "1";
      });
      afterEach(() => {
        delete process.env["NO_COLOR"];
      });

      it("produces plain text without ANSI codes", () => {
        const result = renderCompactBanner();
        // eslint-disable-next-line no-control-regex
        const hasAnsi = /[\u001B\u009B]/.test(result);
        expect(hasAnsi).toBe(false);
      });

      it("still contains Primitiv and version", () => {
        const version = getVersion();
        const result = renderCompactBanner();
        expect(result).toContain("Primitiv");
        expect(result).toContain(version);
      });
    });

    describe("getVersion", () => {
      it("returns a semver-like string", () => {
        const version = getVersion();
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
      });
    });
  });

  describe("Box", () => {
    it("renders top and bottom borders", () => {
      const result = renderBox({ content: "hello" });
      expect(result).toContain("┌");
      expect(result).toContain("┘");
      expect(result).toContain("└");
      expect(result).toContain("┐");
    });

    it("contains the content text", () => {
      const result = renderBox({ content: "test content" });
      expect(result).toContain("test content");
    });

    it("renders a title when provided", () => {
      const result = renderBox({ title: "My Title", content: "body" });
      expect(result).toContain("My Title");
      expect(result).toContain("body");
    });

    it("handles multi-line content", () => {
      const result = renderBox({ content: "line1\nline2\nline3" });
      expect(result).toContain("line1");
      expect(result).toContain("line2");
      expect(result).toContain("line3");
    });

    it("uses side borders for each line", () => {
      const result = renderBox({ content: "hello" });
      const lines = result.split("\n");
      const contentLines = lines.filter((l) => l.includes("hello"));
      expect(contentLines.length).toBe(1);
      expect(contentLines[0]).toMatch(/^│.*hello.*│$/);
    });
  });
});
