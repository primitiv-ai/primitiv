import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ensurePrimitivDir, writePrimitivFile } from "../utils/fileSystem.js";
import { saveState } from "../utils/ids.js";
import { getPackageVersion } from "../utils/version.js";
import { installSlashCommands } from "./installCommands.js";
import { installGitNexusMcp, runGitNexusAnalyze } from "./installGitNexus.js";
import { loadTemplate } from "./templates.js";
import type { InitResult } from "./greenfield.js";

interface DetectedStack {
  languages: string[];
  frameworks: string[];
  databases: string[];
  packageManager: string | null;
}

function detectStack(projectRoot: string): DetectedStack {
  const stack: DetectedStack = {
    languages: [],
    frameworks: [],
    databases: [],
    packageManager: null,
  };

  // Detect package manager
  if (existsSync(join(projectRoot, "package-lock.json"))) {
    stack.packageManager = "npm";
  } else if (existsSync(join(projectRoot, "yarn.lock"))) {
    stack.packageManager = "yarn";
  } else if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) {
    stack.packageManager = "pnpm";
  } else if (existsSync(join(projectRoot, "bun.lockb"))) {
    stack.packageManager = "bun";
  }

  // Detect from package.json
  if (existsSync(join(projectRoot, "package.json"))) {
    stack.languages.push("TypeScript", "JavaScript");
    try {
      const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps.next) stack.frameworks.push("Next.js");
      if (allDeps.react) stack.frameworks.push("React");
      if (allDeps.vue) stack.frameworks.push("Vue");
      if (allDeps.express) stack.frameworks.push("Express");
      if (allDeps.fastify) stack.frameworks.push("Fastify");
      if (allDeps.nestjs || allDeps["@nestjs/core"]) stack.frameworks.push("NestJS");

      if (allDeps.pg || allDeps.postgres) stack.databases.push("PostgreSQL");
      if (allDeps.mysql2 || allDeps.mysql) stack.databases.push("MySQL");
      if (allDeps.mongodb || allDeps.mongoose) stack.databases.push("MongoDB");
      if (allDeps.redis || allDeps.ioredis) stack.databases.push("Redis");
      if (allDeps.prisma || allDeps["@prisma/client"]) stack.frameworks.push("Prisma");
    } catch { /* ignore */ }
  }

  // Python
  if (existsSync(join(projectRoot, "requirements.txt")) || existsSync(join(projectRoot, "pyproject.toml"))) {
    stack.languages.push("Python");
  }

  // Go
  if (existsSync(join(projectRoot, "go.mod"))) {
    stack.languages.push("Go");
  }

  // Rust
  if (existsSync(join(projectRoot, "Cargo.toml"))) {
    stack.languages.push("Rust");
  }

  return stack;
}

export function initBrownfield(projectRoot: string): InitResult & { detectedStack: DetectedStack } {
  // Create .primitiv directory structure
  ensurePrimitivDir(projectRoot);

  // Detect existing stack
  const detectedStack = detectStack(projectRoot);

  // Save initial state
  saveState(projectRoot, {
    nextSpecId: 1,
    nextFeatureId: 1,
    projectRoot,
    mode: "brownfield",
    primitivVersion: getPackageVersion(),
    initializedAt: new Date().toISOString(),
  });

  // Write README template
  const readme = loadTemplate("specs", "README.md");
  writePrimitivFile(projectRoot, ["README.md"], readme);

  // Install slash commands
  const commands = installSlashCommands(projectRoot);

  // Install GitNexus MCP
  installGitNexusMcp(projectRoot);

  // Run GitNexus analysis for existing codebase
  runGitNexusAnalyze(projectRoot);

  return {
    mode: "brownfield",
    directories: [".primitiv/gates", ".primitiv/constitutions", ".primitiv/specs"],
    commands,
    gitNexusInstalled: true,
    detectedStack,
  };
}
