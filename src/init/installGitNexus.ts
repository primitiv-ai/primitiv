import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

interface McpConfig {
  mcpServers: Record<string, {
    command: string;
    args: string[];
  }>;
}

export function installGitNexusMcp(projectRoot: string): void {
  const mcpPath = join(projectRoot, ".mcp.json");
  let config: McpConfig = { mcpServers: {} };

  if (existsSync(mcpPath)) {
    try {
      config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      if (!config.mcpServers) config.mcpServers = {};
    } catch {
      // Malformed file, overwrite
    }
  }

  // Add GitNexus if not already present
  if (!config.mcpServers.gitnexus) {
    config.mcpServers.gitnexus = {
      command: "npx",
      args: ["-y", "gitnexus@latest", "mcp"],
    };
    writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n");
  }
}

export function runGitNexusAnalyze(projectRoot: string): boolean {
  try {
    execSync("npx -y gitnexus@latest analyze", {
      cwd: projectRoot,
      stdio: "pipe",
      timeout: 60000,
    });
    return true;
  } catch {
    // GitNexus not available or failed — non-blocking
    return false;
  }
}
