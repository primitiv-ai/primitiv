import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve templates directory relative to this module
function getTemplatesDir(): string {
  // In development: project root / templates
  // When installed as package: node_modules/primitiv-spec-engine/templates
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // From dist/src/init/ -> go up 3 levels to project root
  const projectRoot = join(__dirname, "..", "..", "..");
  return join(projectRoot, "templates");
}

export function loadTemplate(category: string, name: string): string {
  const templatesDir = getTemplatesDir();
  const filePath = join(templatesDir, category, name);
  return readFileSync(filePath, "utf-8");
}

export function getCommandTemplateNames(): string[] {
  return [
    "primitiv.gate-1.md",
    "primitiv.gate-2.md",
    "primitiv.constitution.md",
    "primitiv.specify.md",
    "primitiv.clarify.md",
    "primitiv.plan.md",
    "primitiv.tasks.md",
    "primitiv.implement.md",
    "primitiv.test-feature.md",
    "primitiv.compushpr.md",
  ];
}
