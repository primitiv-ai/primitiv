import type { SpecStatus } from "@cli/schemas/common.js";
import { getEngine } from "./engine";

export interface DashboardData {
  initialized: boolean;
  projectRoot: string;
  specTotal: number;
  specCounts: Partial<Record<SpecStatus, number>>;
  parseErrorCount: number;
  gates: {
    companyPrinciples: boolean;
    securityPrinciples: boolean;
  };
  constitutions: {
    product: boolean;
    development: boolean;
    architecture: boolean;
  };
  hasLearnings: boolean;
}

export function loadDashboard(): DashboardData {
  const engine = getEngine();
  if (!engine.initialized) {
    return {
      initialized: false,
      projectRoot: engine.projectRoot,
      specTotal: 0,
      specCounts: {},
      parseErrorCount: 0,
      gates: { companyPrinciples: false, securityPrinciples: false },
      constitutions: { product: false, development: false, architecture: false },
      hasLearnings: false,
    };
  }

  const specResult = engine.specs.listWithErrors();
  const counts: Partial<Record<SpecStatus, number>> = {};
  for (const doc of specResult.ok) {
    counts[doc.data.status] = (counts[doc.data.status] ?? 0) + 1;
  }

  const hasGate = (type: "company" | "security"): boolean => {
    try {
      engine.gates.getGate(type);
      return true;
    } catch {
      return false;
    }
  };

  const hasConstitution = (type: "product" | "dev" | "architecture"): boolean => {
    try {
      engine.constitutions.get(type);
      return true;
    } catch {
      return false;
    }
  };

  let hasLearnings = false;
  try {
    hasLearnings = engine.learnings.list().length > 0;
  } catch {
    hasLearnings = false;
  }

  return {
    initialized: true,
    projectRoot: engine.projectRoot,
    specTotal: specResult.ok.length,
    specCounts: counts,
    parseErrorCount: specResult.errors.length,
    gates: {
      companyPrinciples: hasGate("company"),
      securityPrinciples: hasGate("security"),
    },
    constitutions: {
      product: hasConstitution("product"),
      development: hasConstitution("dev"),
      architecture: hasConstitution("architecture"),
    },
    hasLearnings,
  };
}
