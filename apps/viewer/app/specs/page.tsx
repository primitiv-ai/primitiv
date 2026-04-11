import { loadSpecs } from "@/lib/load-specs";
import { SpecsTable } from "@/components/specs-table";
import { WarningBanner } from "@/components/warning-banner";

export const dynamic = "force-dynamic";

export default function SpecsPage() {
  const data = loadSpecs();

  if (!data.initialized) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Specs</h1>
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
        <h1 className="text-3xl font-bold tracking-tight">Specs</h1>
        <p className="text-sm text-muted-foreground">
          {data.rows.length} spec{data.rows.length === 1 ? "" : "s"} on disk
        </p>
      </div>

      {data.errors.length > 0 ? (
        <div className="space-y-2">
          {data.errors.map((err) => (
            <WarningBanner
              key={err.dir}
              title={`Parse error in ${err.dir}`}
              message={err.error}
              filePath={`${err.dir}/${err.file}`}
            />
          ))}
        </div>
      ) : null}

      {data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No specs yet. Run <code className="rounded bg-muted px-1 py-0.5">/primitiv.specify</code>{" "}
          in Claude Code to create one.
        </p>
      ) : (
        <SpecsTable rows={data.rows} />
      )}
    </div>
  );
}
