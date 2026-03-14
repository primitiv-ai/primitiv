import { z } from "zod";
import { FrontmatterBaseSchema, SpecStatusSchema, TimestampSchema } from "./common.js";

export const SpecFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("spec"),
  id: z.string(),
  title: z.string(),
  status: SpecStatusSchema.default("draft"),
  featureId: z.string().optional(),
  branch: z.string().optional(),
  author: z.string().optional(),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
});

export type SpecFrontmatter = z.infer<typeof SpecFrontmatterSchema>;
