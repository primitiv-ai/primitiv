import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { WarningBanner } from "@/components/warning-banner";
import { loadDashboard } from "@/lib/load-dashboard";

export const dynamic = "force-dynamic";

function PresenceBadge({ present, label }: { present: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        present
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-muted text-muted-foreground"
      }
    >
      {present ? "✓" : "—"} {label}
    </Badge>
  );
}

export default function Home() {
  const data = loadDashboard();

  if (!data.initialized) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Primitiv Viewer</h1>
        <WarningBanner
          title="Not a Primitiv project"
          message={`No .primitiv/ directory found at ${data.projectRoot}. Run 'primitiv init' to set up a project first.`}
        />
      </div>
    );
  }

  const statusEntries = Object.entries(data.specCounts);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-mono">{data.projectRoot}</p>
      </div>

      {data.parseErrorCount > 0 ? (
        <WarningBanner
          title={`${data.parseErrorCount} spec${data.parseErrorCount === 1 ? "" : "s"} failed to parse`}
          message="These files are still visible in the Specs list but cannot be rendered in detail until the frontmatter is fixed."
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Specs</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/specs" className="block">
              <div className="text-4xl font-bold hover:underline">{data.specTotal}</div>
              <p className="text-xs text-muted-foreground">total on disk</p>
            </Link>
            {statusEntries.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center gap-1">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">×{count}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <PresenceBadge present={data.gates.companyPrinciples} label="Company Principles" />
            <PresenceBadge present={data.gates.securityPrinciples} label="Security Principles" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Constitutions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <PresenceBadge present={data.constitutions.product} label="Product" />
            <PresenceBadge present={data.constitutions.development} label="Development" />
            <PresenceBadge present={data.constitutions.architecture} label="Architecture" />
          </CardContent>
        </Card>
      </div>

      {data.hasLearnings ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Learnings</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/learnings" className="text-sm hover:underline">
              View learnings →
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
