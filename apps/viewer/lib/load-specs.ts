import type { SpecStatus } from "@cli/schemas/common.js";
import { getEngine } from "./engine";

export interface SpecRow {
  id: string;
  title: string;
  status: SpecStatus;
  branch: string | null;
  author: string | null;
  updatedAt: string | null;
  hasParseError: boolean;
}

export interface SpecListData {
  initialized: boolean;
  rows: SpecRow[];
  errors: { dir: string; file: string; error: string }[];
}

export function loadSpecs(): SpecListData {
  const engine = getEngine();
  if (!engine.initialized) {
    return { initialized: false, rows: [], errors: [] };
  }

  const { ok, errors } = engine.specs.listWithErrors();
  const rows: SpecRow[] = ok.map((doc) => ({
    id: doc.data.id,
    title: doc.data.title,
    status: doc.data.status,
    branch: doc.data.branch ?? null,
    author: doc.data.author ?? null,
    updatedAt: doc.data.updatedAt ?? null,
    hasParseError: false,
  }));

  return { initialized: true, rows, errors };
}
