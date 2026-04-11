"use client";

import { useState } from "react";
import { KanbanSquare, Network } from "lucide-react";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskDependencyGraph } from "@/components/task-dependency-graph";
import { cn } from "@/lib/utils";
import type { TaskCard } from "@/lib/load-spec-detail";

type View = "kanban" | "graph";

interface TaskViewSwitcherProps {
  tasks: TaskCard[];
}

export function TaskViewSwitcher({ tasks }: TaskViewSwitcherProps) {
  const [view, setView] = useState<View>("kanban");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-[3px]">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "inline-flex h-full items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
              view === "kanban"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <KanbanSquare size={14} />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("graph")}
            className={cn(
              "inline-flex h-full items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
              view === "graph"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Network size={14} />
            Dependency graph
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </span>
      </div>

      {view === "kanban" ? <KanbanBoard tasks={tasks} /> : <TaskDependencyGraph tasks={tasks} />}
    </div>
  );
}
