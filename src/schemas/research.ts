import { z } from "zod";
import { FrontmatterBaseSchema, TimestampSchema } from "./common.js";

export const ResearchDecisionSchema = z.object({
  id: z.string().regex(/^R-\d+$/, "Research decision ID must match R-XXX format"),
  title: z.string().min(1),
  decision: z.string().min(1),
  rationale: z.string().min(1),
  alternativesConsidered: z.array(z.string()).min(1, "At least one alternative must be considered"),
  codebasePrecedent: z.string().nullable().default(null),
});

export type ResearchDecision = z.infer<typeof ResearchDecisionSchema>;

export const ResearchFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("research"),
  specId: z.string(),
  decisions: z.array(ResearchDecisionSchema).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type ResearchFrontmatter = z.infer<typeof ResearchFrontmatterSchema>;
