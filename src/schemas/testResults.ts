import { z } from "zod";
import { FrontmatterBaseSchema } from "./common.js";

export const TestTypeSchema = z.enum(["ui", "api", "unit", "integration"]);
export type TestType = z.infer<typeof TestTypeSchema>;

export const TestResultsFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("test-results"),
  specId: z.string(),
  testTypes: z.array(TestTypeSchema).default([]),
  summary: z.object({
    total: z.number().int().nonnegative().default(0),
    passed: z.number().int().nonnegative().default(0),
    failed: z.number().int().nonnegative().default(0),
    skipped: z.number().int().nonnegative().default(0),
  }).default({ total: 0, passed: 0, failed: 0, skipped: 0 }),
});

export type TestResultsFrontmatter = z.infer<typeof TestResultsFrontmatterSchema>;
