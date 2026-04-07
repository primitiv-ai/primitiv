import { z } from "zod";
import { CompanyPrinciplesFrontmatterSchema, SecurityPrinciplesFrontmatterSchema } from "./gates.js";
import {
  ProductConstitutionFrontmatterSchema,
  DevConstitutionFrontmatterSchema,
  ArchConstitutionFrontmatterSchema,
} from "./constitution.js";
import { LearningFrontmatterSchema } from "./learning.js";

// Define a schema for learnings in the governance context (includes description from markdown body)
export const GovernanceContextLearningSchema = LearningFrontmatterSchema.extend({
  description: z.string().default(""),
});
export type GovernanceContextLearning = z.infer<typeof GovernanceContextLearningSchema>;

export const NormalizedConstraintSchema = z.object({
  category: z.enum(["tech", "code", "architecture", "security"]),
  rule: z.string(),
  source: z.string(),
});
export type NormalizedConstraint = z.infer<typeof NormalizedConstraintSchema>;

export const NormalizedConstraintsSchema = z.object({
  tech: z.array(NormalizedConstraintSchema),
  code: z.array(NormalizedConstraintSchema),
  architecture: z.array(NormalizedConstraintSchema),
  security: z.array(NormalizedConstraintSchema),
});
export type NormalizedConstraints = z.infer<typeof NormalizedConstraintsSchema>;

export const CompilationWarningSchema = z.object({
  level: z.literal("warn"),
  message: z.string(),
  source: z.string().optional(),
});

export type CompilationWarning = z.infer<typeof CompilationWarningSchema>;

export const GovernanceContextSchema = z.object({
  version: z.string(),
  compiledAt: z.string(),
  sourceHash: z.string(),
  company: CompanyPrinciplesFrontmatterSchema.nullable(),
  security: SecurityPrinciplesFrontmatterSchema.nullable(),
  product: ProductConstitutionFrontmatterSchema.nullable(),
  development: DevConstitutionFrontmatterSchema.nullable(),
  architecture: ArchConstitutionFrontmatterSchema.nullable(),
  constraints: NormalizedConstraintsSchema,
  learnings: z.array(GovernanceContextLearningSchema).default([]),
  warnings: z.array(CompilationWarningSchema),
});

export type GovernanceContext = z.infer<typeof GovernanceContextSchema>;
