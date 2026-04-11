"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, Clock, FileText, GitBranch, MinusCircle } from "lucide-react";
import type { TaskCard, TaskStatus } from "@/lib/load-spec-detail";
import { cn } from "@/lib/utils";

export const TASK_STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    className: string;
    accent: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Circle,
    className: "text-muted-foreground border-muted-foreground/40",
    accent: "#9ca3af",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    className: "text-tertiary border-tertiary/40",
    accent: "oklch(0.8367 0.0649 346.52)",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-primary border-primary/40",
    accent: "oklch(0.8333 0.0864 285.1)",
  },
  skipped: {
    label: "Skipped",
    icon: MinusCircle,
    className: "text-destructive border-destructive/40",
    accent: "oklch(0.8383 0.0891 26.76)",
  },
};

function parseGherkinRef(ref: string): { feature: string; scenario: string } | null {
  const match = ref.match(/^Feature:\s*(.+?)\s*>\s*Scenario(?:\s+Outline)?:\s*(.+)$/);
  if (!match) return null;
  return { feature: match[1], scenario: match[2] };
}

export function TaskDetailContent({ task }: { task: TaskCard }) {
  const status = TASK_STATUS_META[task.status];
  const StatusIcon = status.icon;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("font-mono", status.className)}>
            <StatusIcon size={12} />
            {status.label}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
        </div>
        <DialogTitle className="font-display text-2xl leading-tight">{task.title}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_240px]">
        <div className="space-y-6">
          {task.description ? (
            <section>
              <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
            </section>
          ) : null}

          {task.acceptanceCriteria.length > 0 ? (
            <section>
              <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Acceptance Criteria ({task.acceptanceCriteria.length})
              </h3>
              <ul className="space-y-2">
                {task.acceptanceCriteria.map((criterion, idx) => {
                  const parsed = parseGherkinRef(criterion);
                  return (
                    <li
                      key={idx}
                      className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs"
                    >
                      {parsed ? (
                        <>
                          <div className="font-display font-semibold text-primary">
                            {parsed.feature}
                          </div>
                          <div className="mt-0.5 text-muted-foreground">
                            <span className="font-mono text-[10px]">→</span> {parsed.scenario}
                          </div>
                        </>
                      ) : (
                        <span className="font-mono">{criterion}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {task.files.length > 0 ? (
            <section>
              <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Files ({task.files.length})
              </h3>
              <ul className="space-y-1">
                {task.files.map((file) => (
                  <li
                    key={file}
                    className="rounded-md border border-border bg-surface-container-high/50 px-3 py-1.5 font-mono text-xs"
                  >
                    {file}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div>
            <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </h3>
            <Badge variant="outline" className={cn("font-mono", status.className)}>
              <StatusIcon size={12} />
              {status.label}
            </Badge>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Depends On
            </h3>
            {task.dependsOn.length === 0 ? (
              <p className="text-xs text-muted-foreground">No dependencies</p>
            ) : (
              <div className="flex flex-col gap-1">
                {task.dependsOn.map((dep) => (
                  <Badge
                    key={dep}
                    variant="outline"
                    className="justify-start font-mono text-[11px]"
                  >
                    ↑ {dep}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Counts
            </h3>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Files</dt>
                <dd className="font-mono">{task.files.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Criteria</dt>
                <dd className="font-mono">{task.acceptanceCriteria.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dependencies</dt>
                <dd className="font-mono">{task.dependsOn.length}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}

interface TaskDetailDialogProps {
  task: TaskCard;
}

export function TaskDetailDialog({ task }: TaskDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const status = TASK_STATUS_META[task.status];
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full text-left"
          aria-label={`Open details for ${task.id}`}
        >
          <Card className="gap-2 p-4 py-4 transition-colors hover:bg-surface-container-high/70 cursor-pointer">
            <div className="flex items-start gap-2">
              <StatusIcon size={14} className={cn("mt-0.5 shrink-0", status.className)} />
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">
                  {task.id}
                </div>
                <h4 className="font-display text-sm font-semibold leading-tight">{task.title}</h4>
              </div>
            </div>
            {task.description ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              {task.files.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <FileText size={10} />
                  {task.files.length}
                </span>
              ) : null}
              {task.dependsOn.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <GitBranch size={10} />
                  {task.dependsOn.length}
                </span>
              ) : null}
              {task.acceptanceCriteria.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  ✓ {task.acceptanceCriteria.length}
                </span>
              ) : null}
            </div>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <TaskDetailContent task={task} />
      </DialogContent>
    </Dialog>
  );
}
