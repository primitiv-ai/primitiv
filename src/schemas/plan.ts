import { z } from "zod";
import { FrontmatterBaseSchema, TimestampSchema } from "./common.js";

export const FileChangeSchema = z.object({
  path: z.string(),
  action: z.enum(["create", "modify", "delete"]),
  description: z.string().optional(),
});

export const PlanFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("plan"),
  specId: z.string(),
  approach: z.string().optional(),
  fileChanges: z.array(FileChangeSchema).default([]),
  risks: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  codebaseAnalysis: z.object({
    existingCode: z.array(z.string()).default([]),
    reusableModules: z.array(z.string()).default([]),
    patternsToFollow: z.array(z.string()).default([]),
  }).default({}),
  updatedAt: TimestampSchema.optional(),
});

export type PlanFrontmatter = z.infer<typeof PlanFrontmatterSchema>;
