import { SpecManager } from "@cli/engine/SpecManager.js";
import { GateManager } from "@cli/engine/GateManager.js";
import { ConstitutionManager } from "@cli/engine/ConstitutionManager.js";
import { LearningManager } from "@cli/engine/LearningManager.js";
import { isPrimitivInitialized } from "@cli/utils/fileSystem.js";
import { getProjectRoot } from "./project-root";

export interface ViewerEngine {
  projectRoot: string;
  initialized: boolean;
  specs: SpecManager;
  gates: GateManager;
  constitutions: ConstitutionManager;
  learnings: LearningManager;
}

const cache = new Map<string, ViewerEngine>();

export function getEngine(): ViewerEngine {
  const projectRoot = getProjectRoot();
  const cached = cache.get(projectRoot);
  if (cached) return cached;

  const engine: ViewerEngine = {
    projectRoot,
    initialized: isPrimitivInitialized(projectRoot),
    specs: new SpecManager(projectRoot),
    gates: new GateManager(projectRoot),
    constitutions: new ConstitutionManager(projectRoot),
    learnings: new LearningManager(projectRoot),
  };
  cache.set(projectRoot, engine);
  return engine;
}
