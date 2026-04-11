import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gateExists, type GateName } from "@/lib/load-gate";
import { WarningBanner } from "@/components/warning-banner";
import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";

const GATES: { name: GateName; label: string; description: string }[] = [
  {
    name: "company-principles",
    label: "Company Principles",
    description: "Mission, values, and boundaries (Gate 1)",
  },
  {
    name: "security-principles",
    label: "Security Principles",
    description: "Security policies and OWASP alignment (Gate 2)",
  },
];

export default function GatesPage() {
  const engine = getEngine();
  if (!engine.initialized) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Gates</h1>
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
        <h1 className="text-3xl font-bold tracking-tight">Gates</h1>
        <p className="text-sm text-muted-foreground">Company and security principles</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {GATES.map((gate) => {
          const present = gateExists(gate.name);
          return (
            <Card key={gate.name} className={present ? "" : "opacity-50"}>
              <CardHeader>
                <CardTitle>{gate.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{gate.description}</p>
              </CardHeader>
              <CardContent>
                {present ? (
                  <Link
                    href={`/gates/${gate.name}`}
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
