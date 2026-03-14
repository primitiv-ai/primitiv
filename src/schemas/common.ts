import { z } from "zod";

export const TimestampSchema = z.string().datetime();

export const FrontmatterBaseSchema = z.object({
  type: z.string(),
  version: z.number().int().positive().default(1),
  updatedAt: TimestampSchema.optional(),
});

export type FrontmatterBase = z.infer<typeof FrontmatterBaseSchema>;

// Spec statuses in order
export const SPEC_STATUSES = [
  "draft",
  "gate-1-passed",
  "gate-2-passed",
  "gate-3-passed",
  "clarified",
  "planned",
  "tasked",
  "in-progress",
  "completed",
] as const;

export const SpecStatusSchema = z.enum(SPEC_STATUSES);
export type SpecStatus = z.infer<typeof SpecStatusSchema>;

export const GateTypeSchema = z.enum(["company", "security"]);
export type GateType = z.infer<typeof GateTypeSchema>;

export const ConstitutionTypeSchema = z.enum(["product", "dev", "architecture"]);
export type ConstitutionType = z.infer<typeof ConstitutionTypeSchema>;
