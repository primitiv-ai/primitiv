import { notFound } from "next/navigation";
import { z } from "zod";
import { FrontmatterPanel } from "@/components/frontmatter-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { WarningBanner } from "@/components/warning-banner";
import { loadGate } from "@/lib/load-gate";

export const dynamic = "force-dynamic";

const GateNameSchema = z.enum(["company-principles", "security-principles"]);

const LABELS = {
  "company-principles": "Company Principles",
  "security-principles": "Security Principles",
} as const;

export default async function GateDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const parsed = GateNameSchema.safeParse(name);
  if (!parsed.success) {
    notFound();
  }

  const gate = loadGate(parsed.data);
  if (!gate) {
    notFound();
  }

  if (!gate.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{LABELS[parsed.data]}</h1>
        <WarningBanner
          title="Failed to parse frontmatter"
          message={gate.parseError}
          filePath={gate.filePath}
        />
        <div className="rounded-md border bg-card p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs">{gate.rawBody}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{LABELS[gate.name]}</h1>
      <FrontmatterPanel frontmatter={gate.frontmatter} />
      <MarkdownRenderer>{gate.body}</MarkdownRenderer>
    </div>
  );
}
