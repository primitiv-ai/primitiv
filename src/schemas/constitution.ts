import { z } from "zod";
import { FrontmatterBaseSchema, TimestampSchema } from "./common.js";

export const ProductConstitutionFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("product-constitution"),
  product: z.object({
    name: z.string(),
    domain: z.string().optional(),
    targetUsers: z.array(z.string()).default([]),
    valueProposition: z.string().optional(),
  }),
  featureRegistry: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["planned", "in-progress", "shipped", "deprecated"]).default("planned"),
  })).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type ProductConstitutionFrontmatter = z.infer<typeof ProductConstitutionFrontmatterSchema>;

export const DevConstitutionFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("dev-constitution"),
  stack: z.object({
    languages: z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
    databases: z.array(z.string()).default([]),
    infrastructure: z.array(z.string()).default([]),
  }).default({}),
  conventions: z.object({
    codeStyle: z.array(z.string()).default([]),
    testing: z.array(z.string()).default([]),
    documentation: z.array(z.string()).default([]),
  }).default({}),
  agentRules: z.array(z.string()).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type DevConstitutionFrontmatter = z.infer<typeof DevConstitutionFrontmatterSchema>;

export const ArchConstitutionFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("arch-constitution"),
  patterns: z.object({
    style: z.string().optional(),
    communication: z.string().optional(),
    dataFlow: z.string().optional(),
  }).default({}),
  boundaries: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    owns: z.array(z.string()).default([]),
  })).default([]),
  adrs: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(["proposed", "accepted", "deprecated", "superseded"]).default("proposed"),
    decision: z.string(),
  })).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type ArchConstitutionFrontmatter = z.infer<typeof ArchConstitutionFrontmatterSchema>;
