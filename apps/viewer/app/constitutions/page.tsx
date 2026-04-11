import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { constitutionExists, type ConstitutionName } from "@/lib/load-constitution";
import { WarningBanner } from "@/components/warning-banner";
import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";

const CONSTITUTIONS: { name: ConstitutionName; label: string; description: string }[] = [
  {
    name: "product",
    label: "Product",
    description: "Product identity, users, modules, value proposition",
  },
  {
    name: "development",
    label: "Development",
    description: "Tech stack, code conventions, testing, agent rules",
  },
  {
    name: "architecture",
    label: "Architecture",
    description: "Patterns, boundaries, ADRs, per-spec tech stack log",
  },
];

export default function ConstitutionsPage() {
  const engine = getEngine();
  if (!engine.initialized) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Constitutions</h1>
        <WarningBanner
          title="Not a Primitiv project"
          message="Run 'primitiv init' to set up a project first."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Constitutions</h1>
        <p className="text-sm text-muted-foreground">Gate 3 governance documents</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CONSTITUTIONS.map((c) => {
          const present = constitutionExists(c.name);
          return (
            <Card key={c.name} className={present ? "" : "opacity-50"}>
              <CardHeader>
                <CardTitle>{c.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{c.description}</p>
              </CardHeader>
              <CardContent>
                {present ? (
                  <Link
                    href={`/constitutions/${c.name}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View →
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">Not defined</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
