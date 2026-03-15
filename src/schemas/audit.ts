import { z } from "zod";
import { TimestampSchema } from "./common.js";

export const AuditActionSchema = z.enum([
  "SPEC_CREATED",
  "GATE_CHECK_PASSED",
  "GATE_CHECK_WARNED",
  "GATE_CHECK_FAILED",
  "SPEC_CLARIFIED",
  "SPEC_PLANNED",
  "SPEC_TASKED",
  "STATUS_CHANGED",
]);

export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditRecordSchema = z.object({
  timestamp: TimestampSchema,
  actor: z.string(),
  action: AuditActionSchema,
  specId: z.string(),
  previousStatus: z.string().nullable(),
  newStatus: z.string(),
  details: z.record(z.unknown()).nullable().default(null),
});

export type AuditRecord = z.infer<typeof AuditRecordSchema>;
