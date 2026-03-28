import { z } from "zod";
import { FrontmatterBaseSchema, TimestampSchema } from "./common.js";

export const CompanyPrinciplesFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("company-principles"),
  company: z.object({
    name: z.string(),
    mission: z.string().optional(),
    values: z.array(z.string()).default([]),
  }),
  policies: z.object({
    compliance: z.array(z.string()).default([]),
    legal: z.array(z.string()).default([]),
    branding: z.array(z.string()).default([]),
  }).default({}),
  businessAlignment: z.object({
    priorities: z.array(z.string()).default([]),
    boundaries: z.array(z.string()).default([]),
  }).default({}),
  operatingPrinciples: z.array(z.string()).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type CompanyPrinciplesFrontmatter = z.infer<typeof CompanyPrinciplesFrontmatterSchema>;

export const SecurityPrinciplesFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("security-principles"),
  policies: z.object({
    authentication: z.array(z.string()).default([]),
    dataHandling: z.array(z.string()).default([]),
    dependencies: z.array(z.string()).default([]),
    networking: z.array(z.string()).default([]),
  }).default({}),
  owaspAlignment: z.array(z.string()).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type SecurityPrinciplesFrontmatter = z.infer<typeof SecurityPrinciplesFrontmatterSchema>;
