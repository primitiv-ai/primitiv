import { ensurePrimitivDir, writePrimitivFile } from "../utils/fileSystem.js";
import { saveState } from "../utils/ids.js";
import { getPackageVersion } from "../utils/version.js";
import { installSlashCommands } from "./installCommands.js";
import { installGitNexusMcp } from "./installGitNexus.js";
import { loadTemplate } from "./templates.js";

export interface InitResult {
  mode: "greenfield" | "brownfield";
  directories: string[];
  commands: string[];
  gitNexusInstalled: boolean;
}

export function initGreenfield(projectRoot: string): InitResult {
  // Create .primitiv directory structure
  ensurePrimitivDir(projectRoot);

  // Save initial state
  saveState(projectRoot, {
    nextSpecId: 1,
    nextFeatureId: 1,
    projectRoot,
    mode: "greenfield",
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

  return {
    mode: "greenfield",
    directories: [".primitiv/gates", ".primitiv/constitutions", ".primitiv/specs"],
    commands,
    gitNexusInstalled: true,
  };
}
