import { z } from "zod";
import { FrontmatterBaseSchema, TimestampSchema } from "./common.js";

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed", "skipped"]).default("pending"),
  files: z.array(z.string()).default([]),
  /** References Gherkin scenario names from the spec. Format: "Feature: X > Scenario: Y" */
  acceptanceCriteria: z.array(z.string()).default([]),
  dependsOn: z.array(z.string()).default([]),
});

export type TaskItem = z.infer<typeof TaskItemSchema>;

export const TasksFrontmatterSchema = FrontmatterBaseSchema.extend({
  type: z.literal("tasks"),
  specId: z.string(),
  tasks: z.array(TaskItemSchema).default([]),
  updatedAt: TimestampSchema.optional(),
});

export type TasksFrontmatter = z.infer<typeof TasksFrontmatterSchema>;
