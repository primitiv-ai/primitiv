import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { getSpecDir } from "../utils/fileSystem.js";
import { AuditRecordSchema } from "../schemas/audit.js";
import type { AuditRecord, AuditAction } from "../schemas/audit.js";
import { getGitUser } from "../git/gitGuard.js";

export class AuditManager {
  constructor(private projectRoot: string) {}

  appendAuditRecord(
    specId: string,
    action: AuditAction,
    previousStatus: string | null,
    newStatus: string,
    details?: Record<string, unknown> | null,
  ): AuditRecord {
    const dir = getSpecDir(this.projectRoot, specId);
    const logPath = join(dir, "audit.log");

    let actor: string;
    try {
      actor = getGitUser(this.projectRoot);
    } catch {
      actor = "system";
    }

    const record: AuditRecord = AuditRecordSchema.parse({
      timestamp: new Date().toISOString(),
      actor,
      action,
      specId,
      previousStatus,
      newStatus,
      details: details ?? null,
    });

    const logDir = dirname(logPath);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const line = JSON.stringify(record) + "\n";
    if (existsSync(logPath)) {
      const existing = readFileSync(logPath, "utf-8");
      writeFileSync(logPath, existing + line);
    } else {
      writeFileSync(logPath, line);
    }

    return record;
  }

  readAuditLog(specId: string): AuditRecord[] {
    const dir = getSpecDir(this.projectRoot, specId);
    const logPath = join(dir, "audit.log");

    if (!existsSync(logPath)) return [];

    const content = readFileSync(logPath, "utf-8").trim();
    if (!content) return [];

    return content.split("\n").map(line => AuditRecordSchema.parse(JSON.parse(line)));
  }
}
