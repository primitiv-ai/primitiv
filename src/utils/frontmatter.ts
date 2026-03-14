import matter from "gray-matter";
import { z } from "zod";

export interface ParsedDocument<T> {
  data: T;
  content: string;
  raw: string;
}

export function parseDocument<S extends z.ZodTypeAny>(
  raw: string,
  schema: S
): ParsedDocument<z.output<S>> {
  const { data, content } = matter(raw);
  const parsed = schema.parse(data);
  return { data: parsed, content: content.trim(), raw };
}

export function serializeDocument(
  data: Record<string, unknown>,
  content: string
): string {
  return matter.stringify(content, data);
}
