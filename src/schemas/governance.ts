import { z } from "zod";
import { CompanyPrinciplesFrontmatterSchema, SecurityPrinciplesFrontmatterSchema } from "./gates.js";
import {
  ProductConstitutionFrontmatterSchema,
  DevConstitutionFrontmatterSchema,
  ArchConstitutionFrontmatterSchema,
} from "./constitution.js";

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
  warnings: z.array(CompilationWarningSchema),
});

export type GovernanceContext = z.infer<typeof GovernanceContextSchema>;
