import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrontmatterPanel } from "@/components/frontmatter-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { StatusBadge } from "@/components/status-badge";
import { WarningBanner } from "@/components/warning-banner";
import { TaskViewSwitcher } from "@/components/task-view-switcher";
import { loadSpecDetail, type ArtifactKey } from "@/lib/load-spec-detail";

export const dynamic = "force-dynamic";

const ARTIFACT_LABELS: Record<ArtifactKey, string> = {
  spec: "Spec",
  clarifications: "Clarifications",
  plan: "Plan",
  tasks: "Tasks",
  "test-results": "Test Results",
  research: "Research",
};

const ARTIFACT_ORDER: ArtifactKey[] = [
  "spec",
  "clarifications",
  "plan",
  "tasks",
  "test-results",
  "research",
];

export default async function SpecDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = loadSpecDetail(id);

  if (!detail) {
    notFound();
  }

  if (!detail.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{detail.id}</h1>
          <p className="text-sm text-muted-foreground">Malformed frontmatter</p>
        </div>
        <WarningBanner
          title="Failed to parse frontmatter"
          message={detail.parseError}
          filePath={detail.filePath}
        />
        <div className="rounded-md border bg-card p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs">{detail.rawBody}</pre>
        </div>
      </div>
    );
  }

  const availableTabs = ARTIFACT_ORDER.filter((key) => detail.artifacts[key] !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {detail.id}: {detail.title}
          </h1>
          <div className="mt-2">
            <StatusBadge status={detail.status} />
          </div>
        </div>
      </div>

      <FrontmatterPanel frontmatter={detail.frontmatter} />

      <Tabs defaultValue={availableTabs[0] ?? "spec"} className="w-full">
        <TabsList>
          {availableTabs.map((key) => (
            <TabsTrigger key={key} value={key}>
              {ARTIFACT_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
        {availableTabs.map((key) => (
          <TabsContent key={key} value={key} className="mt-6">
            {key === "tasks" && detail.tasksData ? (
              <TaskViewSwitcher tasks={detail.tasksData} />
            ) : (
              <MarkdownRenderer>{detail.artifacts[key] ?? ""}</MarkdownRenderer>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
