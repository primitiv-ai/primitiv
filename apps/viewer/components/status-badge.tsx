import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  "gate-1-passed": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "gate-2-passed": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "gate-3-passed": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  clarified: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  planned: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  tasked: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  "in-progress": "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  tested: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
  reviewed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-green-500/15 text-green-300 border-green-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", classes)}>
      {status}
    </Badge>
  );
}
