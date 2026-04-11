import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export const remarkPlugins = [remarkGfm];
export const rehypePlugins = [rehypeHighlight];

const GHERKIN_KEYWORDS = ["Given", "When", "Then", "And", "But"] as const;
export type GherkinKeyword = (typeof GHERKIN_KEYWORDS)[number];

export function detectGherkinKeyword(line: string): GherkinKeyword | null {
  const trimmed = line.trimStart();
  for (const keyword of GHERKIN_KEYWORDS) {
    if (trimmed.startsWith(`${keyword} `)) return keyword;
  }
  return null;
}

export function isGherkinHeading(text: string): boolean {
  return /^(Feature|Background|Scenario Outline|Scenario):/.test(text.trim());
}
