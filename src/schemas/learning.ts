import { z } from "zod";
import { FrontmatterBaseSchema, TimestampSchema } from "./common.js";

export const LearningTypeSchema = z.enum(["best-practice", "error-resolution", "convention"]);
export const LearningSourceSchema = z.enum(["user", "gate-failure", "test-failure", "clarification", "review"]);
export const LearningSeveritySchema = z.enum(["info", "important", "critical"]);

export const LearningFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("learning"),
  id: z.string().regex(/^LEARN-\d+$/, "Learning ID must match LEARN-XXX format"),
  learningType: LearningTypeSchema,
  title: z.string().min(1),
  source: LearningSourceSchema,
  specId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  severity: LearningSeveritySchema.default("info"),
  author: z.string().default("system"),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export type LearningType = z.infer<typeof LearningTypeSchema>;
export type LearningSource = z.infer<typeof LearningSourceSchema>;
export type LearningSeverity = z.infer<typeof LearningSeveritySchema>;
export type LearningFrontmatter = z.infer<typeof LearningFrontmatterSchema>;
