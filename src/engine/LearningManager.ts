import { existsSync, readdirSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getPrimitivRoot, writePrimitivFile } from "../utils/fileSystem.js";
import { parseDocument, serializeDocument } from "../utils/frontmatter.js";
import { nextLearningId, slugify } from "../utils/ids.js";
import { LearningFrontmatterSchema } from "../schemas/learning.js";
import type { LearningFrontmatter, LearningType, LearningSource, LearningSeverity } from "../schemas/learning.js";
import { getGitUser } from "../git/gitGuard.js";

export interface LearningRecord {
  data: LearningFrontmatter;
  description: string;
}

export interface CreateLearningOptions {
  learningType: LearningType;
  title: string;
  description: string;
  source?: LearningSource;
  specId?: string | null;
  tags?: string[];
  severity?: LearningSeverity;
}

export interface ListLearningFilter {
  learningType?: LearningType;
  tag?: string;
  severity?: LearningSeverity;
  source?: LearningSource;
}

export class LearningManager {
  constructor(private projectRoot: string) {}

  create(opts: CreateLearningOptions): LearningRecord {
    const id = nextLearningId(this.projectRoot);
    const now = new Date().toISOString();

    let author: string;
    try {
      author = getGitUser(this.projectRoot);
    } catch {
      author = "system";
    }

    const frontmatter: Record<string, unknown> = {
      type: "learning",
      version: 1,
      id,
      learningType: opts.learningType,
      title: opts.title,
      source: opts.source ?? "user",
      specId: opts.specId ?? null,
      tags: opts.tags ?? [],
      severity: opts.severity ?? "info",
      author,
      createdAt: now,
      updatedAt: now,
    };

    const slug = slugify(opts.title);
    const filename = `${id}-${slug}.md`;
    const serialized = serializeDocument(frontmatter, opts.description);

    writePrimitivFile(this.projectRoot, ["learnings", filename], serialized);

    const parsed = LearningFrontmatterSchema.parse(frontmatter);
    return { data: parsed, description: opts.description };
  }

  list(filter?: ListLearningFilter): LearningRecord[] {
    const records = this.readAllLearnings();

    let filtered = records;
    if (filter) {
      if (filter.learningType) {
        filtered = filtered.filter(r => r.data.learningType === filter.learningType);
      }
      if (filter.tag) {
        const tagLower = filter.tag.toLowerCase();
        filtered = filtered.filter(r =>
          r.data.tags.some(t => t.toLowerCase() === tagLower)
        );
      }
      if (filter.severity) {
        filtered = filtered.filter(r => r.data.severity === filter.severity);
      }
      if (filter.source) {
        filtered = filtered.filter(r => r.data.source === filter.source);
      }
    }

    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) =>
      new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
    );

    return filtered;
  }

  get(id: string): LearningRecord | null {
    const records = this.readAllLearnings();
    return records.find(r => r.data.id === id) ?? null;
  }

  search(query: string): LearningRecord[] {
    const queryLower = query.toLowerCase();
    const records = this.readAllLearnings();

    return records.filter(r =>
      r.data.title.toLowerCase().includes(queryLower) ||
      r.description.toLowerCase().includes(queryLower)
    );
  }

  delete(id: string): boolean {
    const dir = this.learningsDir();
    if (!existsSync(dir)) return false;

    const files = readdirSync(dir).filter(f => f.endsWith(".md"));
    const target = files.find(f => f.startsWith(id));

    if (!target) return false;

    unlinkSync(join(dir, target));
    return true;
  }

  findRelevant(keywords: string[]): LearningRecord[] {
    if (keywords.length === 0) return [];

    const keywordsLower = keywords.map(k => k.toLowerCase());
    const records = this.readAllLearnings();

    return records.filter(r =>
      r.data.tags.some(tag =>
        keywordsLower.some(kw => tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase()))
      )
    );
  }

  private learningsDir(): string {
    return join(getPrimitivRoot(this.projectRoot), "learnings");
  }

  private readAllLearnings(): LearningRecord[] {
    const dir = this.learningsDir();
    if (!existsSync(dir)) return [];

    const files = readdirSync(dir).filter(f => f.endsWith(".md"));
    const records: LearningRecord[] = [];

    for (const file of files) {
      const raw = readFileSync(join(dir, file), "utf-8");
      try {
        const doc = parseDocument(raw, LearningFrontmatterSchema);
        records.push({ data: doc.data, description: doc.content });
      } catch {
        // Skip malformed files
      }
    }

    return records;
  }
}
