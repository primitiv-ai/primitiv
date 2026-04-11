import { notFound } from "next/navigation";
import { FrontmatterPanel } from "@/components/frontmatter-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { WarningBanner } from "@/components/warning-banner";
import { loadLearningDetail } from "@/lib/load-learnings";

export const dynamic = "force-dynamic";

export default async function LearningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^LEARN-\d{3,}$/.test(id)) {
    notFound();
  }

  const learning = loadLearningDetail(id);
  if (!learning) {
    notFound();
  }

  if (!learning.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{learning.id}</h1>
        <WarningBanner
          title="Failed to parse frontmatter"
          message={learning.parseError}
          filePath={learning.filePath}
        />
        <div className="rounded-md border bg-card p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs">{learning.rawBody}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{learning.id}</h1>
      <FrontmatterPanel frontmatter={learning.frontmatter} />
      <MarkdownRenderer>{learning.body}</MarkdownRenderer>
    </div>
  );
}
