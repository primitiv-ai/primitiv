import { Badge } from "@/components/ui/badge";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { cn } from "@/lib/utils";
import type { TaskCard, TaskStatus } from "@/lib/load-spec-detail";

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "pending", label: "Pending", accent: "border-muted-foreground/30" },
  { status: "in-progress", label: "In Progress", accent: "border-tertiary/50" },
  { status: "completed", label: "Completed", accent: "border-primary/50" },
  { status: "skipped", label: "Skipped", accent: "border-destructive/40" },
];

interface KanbanBoardProps {
  tasks: TaskCard[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const grouped = new Map<TaskStatus, TaskCard[]>();
  for (const column of COLUMNS) {
    grouped.set(column.status, []);
  }
  for (const task of tasks) {
    grouped.get(task.status)?.push(task);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((column) => {
        const columnTasks = grouped.get(column.status) ?? [];
        return (
          <div
            key={column.status}
            className={cn(
              "flex flex-col gap-3 rounded-lg border-2 bg-surface-container-high/30 p-3",
              column.accent,
            )}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {column.label}
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {columnTasks.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground/60">—</p>
              ) : (
                columnTasks.map((task) => <TaskDetailDialog key={task.id} task={task} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
