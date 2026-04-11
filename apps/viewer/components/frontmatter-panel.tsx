import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FrontmatterPanelProps {
  frontmatter: Record<string, unknown>;
  title?: string;
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof value === "string") return <span>{value}</span>;
  if (typeof value === "number" || typeof value === "boolean") return <span>{String(value)}</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">[]</span>;
    return (
      <ul className="list-disc pl-5">
        {value.map((item, i) => (
          <li key={i}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-muted-foreground">{"{}"}</span>;
    return (
      <dl className="ml-2 space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="font-mono text-xs text-muted-foreground">{k}:</dt>
            <dd className="text-xs">{renderValue(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{String(value)}</span>;
}

export function FrontmatterPanel({ frontmatter, title = "Metadata" }: FrontmatterPanelProps) {
  const entries = Object.entries(frontmatter);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No frontmatter.</p>
        ) : (
          <dl className="space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[120px_1fr] gap-3">
                <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
                <dd className="text-xs">{renderValue(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
