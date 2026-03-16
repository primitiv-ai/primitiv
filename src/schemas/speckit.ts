import { z } from "zod";

/**
 * Loose schema for SpecKit spec.md frontmatter.
 * Uses passthrough to accept unknown fields from varying SpecKit versions.
 */
export const SpecKitSpecFrontmatterSchema = z.object({
  title: z.string().optional(),
  status: z.string().optional(),
  version: z.union([z.number(), z.string()]).optional(),
  author: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type SpecKitSpecFrontmatter = z.infer<typeof SpecKitSpecFrontmatterSchema>;

/**
 * Loose schema for SpecKit plan.md frontmatter.
 */
export const SpecKitPlanFrontmatterSchema = z.object({
  title: z.string().optional(),
  status: z.string().optional(),
  version: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export type SpecKitPlanFrontmatter = z.infer<typeof SpecKitPlanFrontmatterSchema>;

/**
 * Loose schema for SpecKit tasks.md frontmatter.
 */
export const SpecKitTasksFrontmatterSchema = z.object({
  title: z.string().optional(),
  status: z.string().optional(),
  tasks: z.array(z.record(z.unknown())).optional(),
}).passthrough();

export type SpecKitTasksFrontmatter = z.infer<typeof SpecKitTasksFrontmatterSchema>;
