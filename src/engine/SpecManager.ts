import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { writePrimitivFile, listSpecDirs, getSpecDir, getPrimitivRoot } from "../utils/fileSystem.js";
import { parseDocument, serializeDocument } from "../utils/frontmatter.js";
import { SpecFrontmatterSchema } from "../schemas/spec.js";
import { PlanFrontmatterSchema } from "../schemas/plan.js";
import { TasksFrontmatterSchema } from "../schemas/task.js";
import { TestResultsFrontmatterSchema } from "../schemas/testResults.js";
import type { SpecFrontmatter } from "../schemas/spec.js";
import type { PlanFrontmatter } from "../schemas/plan.js";
import type { TasksFrontmatter } from "../schemas/task.js";
import type { TestResultsFrontmatter } from "../schemas/testResults.js";
import type { ParsedDocument } from "../utils/frontmatter.js";
import type { SpecStatus } from "../schemas/common.js";
import { SpecNotFoundError } from "../utils/errors.js";
import { assertTransition } from "../state/specStateMachine.js";
import { nextSpecId, slugify } from "../utils/ids.js";
import type { AuditManager } from "./AuditManager.js";

export class SpecManager {
  private auditManager: AuditManager | null = null;

  constructor(private projectRoot: string) {}

  setAuditManager(audit: AuditManager): void {
    this.auditManager = audit;
  }

  create(title: string, description: string, branch?: string, author?: string): SpecFrontmatter {
    const id = nextSpecId(this.projectRoot);
    const slug = slugify(title);
    const dirName = `${id}-${slug}`;
    const now = new Date().toISOString();

    const data: SpecFrontmatter = {
      type: "spec",
      id,
      title,
      status: "draft",
      version: 1,
      branch: branch ?? `spec/${id}-${slug}`,
      author,
      createdAt: now,
      updatedAt: now,
    };

    const content = `## Description\n\n${description}\n\n## Acceptance Criteria\n\n- [ ] TODO\n\n## Test Strategy\n\n<!-- What types of tests are needed: unit, integration, API, UI -->\n\n## Constraints\n\nNone specified.\n\n## Out of Scope\n\n<!-- What this spec explicitly does NOT cover -->`;
    const serialized = serializeDocument(data as unknown as Record<string, unknown>, content);
    writePrimitivFile(this.projectRoot, ["specs", dirName, "spec.md"], serialized);

    this.auditManager?.appendAuditRecord(id, "SPEC_CREATED", null, "draft");

    return data;
  }

  get(specId: string) {
    const dir = getSpecDir(this.projectRoot, specId);
    const specPath = join(dir, "spec.md");
    if (!existsSync(specPath)) throw new SpecNotFoundError(specId);
    const raw = readFileSync(specPath, "utf-8");
    return parseDocument(raw, SpecFrontmatterSchema);
  }

  list(filter?: { status?: SpecStatus }) {
    const dirs = listSpecDirs(this.projectRoot);
    const specs: ParsedDocument<SpecFrontmatter>[] = [];
    for (const dir of dirs) {
      const specPath = join(getPrimitivRoot(this.projectRoot), "specs", dir, "spec.md");
      if (!existsSync(specPath)) continue;
      const raw = readFileSync(specPath, "utf-8");
      try {
        const doc = parseDocument(raw, SpecFrontmatterSchema);
        if (!filter?.status || doc.data.status === filter.status) {
          specs.push(doc);
        }
      } catch {
        // Skip malformed specs
      }
    }
    return specs;
  }

  listWithErrors(filter?: { status?: SpecStatus }): {
    ok: ParsedDocument<SpecFrontmatter>[];
    errors: { dir: string; file: string; error: string }[];
  } {
    const dirs = listSpecDirs(this.projectRoot);
    const ok: ParsedDocument<SpecFrontmatter>[] = [];
    const errors: { dir: string; file: string; error: string }[] = [];
    for (const dir of dirs) {
      const specPath = join(getPrimitivRoot(this.projectRoot), "specs", dir, "spec.md");
      if (!existsSync(specPath)) continue;
      const raw = readFileSync(specPath, "utf-8");
      try {
        const doc = parseDocument(raw, SpecFrontmatterSchema);
        if (!filter?.status || doc.data.status === filter.status) {
          ok.push(doc);
        }
      } catch (err) {
        errors.push({
          dir,
          file: "spec.md",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return { ok, errors };
  }

  updateStatus(specId: string, newStatus: SpecStatus): void {
    const doc = this.get(specId);
    const previousStatus = doc.data.status;
    assertTransition(doc.data.status, newStatus);
    const updated = {
      ...doc.data,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    const serialized = serializeDocument(updated as unknown as Record<string, unknown>, doc.content);
    const dir = getSpecDir(this.projectRoot, specId);
    const specPath = join(dir, "spec.md");
    writeFileSync(specPath, serialized);

    this.auditManager?.appendAuditRecord(specId, "STATUS_CHANGED", previousStatus, newStatus);
  }

  getPlan(specId: string) {
    const dir = getSpecDir(this.projectRoot, specId);
    const planPath = join(dir, "plan.md");
    if (!existsSync(planPath)) return null;
    const raw = readFileSync(planPath, "utf-8");
    return parseDocument(raw, PlanFrontmatterSchema);
  }

  getTasks(specId: string) {
    const dir = getSpecDir(this.projectRoot, specId);
    const tasksPath = join(dir, "tasks.md");
    if (!existsSync(tasksPath)) return null;
    const raw = readFileSync(tasksPath, "utf-8");
    return parseDocument(raw, TasksFrontmatterSchema);
  }

  getTestResults(specId: string) {
    const dir = getSpecDir(this.projectRoot, specId);
    const testResultsPath = join(dir, "test-results.md");
    if (!existsSync(testResultsPath)) return null;
    const raw = readFileSync(testResultsPath, "utf-8");
    return parseDocument(raw, TestResultsFrontmatterSchema);
  }

  getSpecGraph(specId: string) {
    const spec = this.get(specId);
    const plan = this.getPlan(specId);
    const tasks = this.getTasks(specId);
    const testResults = this.getTestResults(specId);

    const dir = getSpecDir(this.projectRoot, specId);
    const clarPath = join(dir, "clarifications.md");
    const clarifications = existsSync(clarPath) ? readFileSync(clarPath, "utf-8") : null;

    const researchPath = join(dir, "research.md");
    const research = existsSync(researchPath) ? readFileSync(researchPath, "utf-8") : null;

    const checklistFiles = listSubdirFiles(dir, "checklists");
    const dataModelFiles = listSubdirFiles(dir, "data-model");

    return {
      spec,
      plan,
      tasks,
      testResults,
      clarifications,
      research,
      checklistFiles,
      dataModelFiles,
    };
  }
}

function listSubdirFiles(specDir: string, subdirName: string): string[] {
  const subdirPath = join(specDir, subdirName);
  if (!existsSync(subdirPath)) return [];
  try {
    const stat = statSync(subdirPath);
    if (!stat.isDirectory()) return [];
    return readdirSync(subdirPath).filter((name) => {
      const entryStat = statSync(join(subdirPath, name));
      return entryStat.isFile();
    });
  } catch {
    return [];
  }
}
