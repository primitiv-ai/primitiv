import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadLearningsList } from "@/lib/load-learnings";
import { WarningBanner } from "@/components/warning-banner";
import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default function LearningsPage() {
  const engine = getEngine();
  if (!engine.initialized) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Learnings</h1>
        <WarningBanner
          title="Not a Primitiv project"
          message="Run 'primitiv init' to set up a project first."
        />
      </div>
    );
  }

  const rows = loadLearningsList();

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learnings</h1>
          <p className="text-sm text-muted-foreground">Recorded lessons from past work</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No learnings recorded yet — run{" "}
              <code className="rounded bg-muted px-1 py-0.5">/primitiv.learn</code> in Claude Code
              to add one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learnings</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} learning{rows.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base">
                  <Link href={`/learnings/${row.id}`} className="hover:underline">
                    {row.id}: {row.title}
                  </Link>
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {row.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {row.type}
                </Badge>
                {row.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
