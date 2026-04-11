import { notFound } from "next/navigation";
import { z } from "zod";
import { FrontmatterPanel } from "@/components/frontmatter-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { WarningBanner } from "@/components/warning-banner";
import { loadConstitution } from "@/lib/load-constitution";

export const dynamic = "force-dynamic";

const NameSchema = z.enum(["product", "development", "architecture"]);

const LABELS = {
  product: "Product",
  development: "Development",
  architecture: "Architecture",
} as const;

export default async function ConstitutionDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const parsed = NameSchema.safeParse(name);
  if (!parsed.success) {
    notFound();
  }

  const constitution = loadConstitution(parsed.data);
  if (!constitution) {
    notFound();
  }

  if (!constitution.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{LABELS[parsed.data]} Constitution</h1>
        <WarningBanner
          title="Failed to parse frontmatter"
          message={constitution.parseError}
          filePath={constitution.filePath}
        />
        <div className="rounded-md border bg-card p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs">{constitution.rawBody}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {LABELS[constitution.name]} Constitution
      </h1>
      <FrontmatterPanel frontmatter={constitution.frontmatter} />
      <MarkdownRenderer>{constitution.body}</MarkdownRenderer>
    </div>
  );
}
