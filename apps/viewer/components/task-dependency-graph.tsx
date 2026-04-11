"use client";

import "@xyflow/react/dist/style.css";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import Dagre from "@dagrejs/dagre";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TaskDetailContent, TASK_STATUS_META } from "@/components/task-detail-dialog";
import type { TaskCard } from "@/lib/load-spec-detail";
import { cn } from "@/lib/utils";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 96;

type TaskNodeData = {
  task: TaskCard;
  onOpen: (task: TaskCard) => void;
};

function TaskNode({ data }: NodeProps) {
  const { task, onOpen } = data as TaskNodeData;
  const status = TASK_STATUS_META[task.status];
  const StatusIcon = status.icon;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <button
        type="button"
        onClick={() => onOpen(task)}
        className={cn(
          "flex w-[240px] flex-col gap-1 rounded-lg border-2 bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-surface-container-high",
          status.className,
        )}
        style={{ height: NODE_HEIGHT }}
      >
        <div className="flex items-center gap-1.5 text-[10px]">
          <StatusIcon size={10} />
          <span className="font-mono uppercase text-muted-foreground">{task.id}</span>
        </div>
        <h4 className="line-clamp-2 font-display text-sm font-semibold leading-tight text-foreground">
          {task.title}
        </h4>
        <div className="mt-auto flex gap-2 text-[9px] text-muted-foreground">
          {task.files.length > 0 ? <span>{task.files.length}📄</span> : null}
          {task.acceptanceCriteria.length > 0 ? <span>{task.acceptanceCriteria.length}✓</span> : null}
        </div>
      </button>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </>
  );
}

const nodeTypes = { task: TaskNode };

function layoutGraph(tasks: TaskCard[], onOpen: (task: TaskCard) => void) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    ranksep: 80,
    nodesep: 40,
    marginx: 20,
    marginy: 20,
  });

  for (const task of tasks) {
    g.setNode(task.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges: Edge[] = [];
  for (const task of tasks) {
    for (const dep of task.dependsOn) {
      if (tasks.find((t) => t.id === dep)) {
        g.setEdge(dep, task.id);
        edges.push({
          id: `${dep}->${task.id}`,
          source: dep,
          target: task.id,
          type: "smoothstep",
          animated: false,
          style: { stroke: "oklch(0.6561 0.0165 298.4)", strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "oklch(0.6561 0.0165 298.4)",
            width: 18,
            height: 18,
          },
        });
      }
    }
  }

  Dagre.layout(g);

  const nodes: Node[] = tasks.map((task) => {
    const nodeWithPosition = g.node(task.id);
    return {
      id: task.id,
      type: "task",
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: { task, onOpen } satisfies TaskNodeData,
      draggable: true,
    };
  });

  return { nodes, edges };
}

interface TaskDependencyGraphProps {
  tasks: TaskCard[];
}

export function TaskDependencyGraph({ tasks }: TaskDependencyGraphProps) {
  const [selected, setSelected] = useState<TaskCard | null>(null);

  const { nodes, edges } = useMemo(
    () => layoutGraph(tasks, (task) => setSelected(task)),
    [tasks],
  );

  return (
    <>
      <div className="h-[70vh] w-full overflow-hidden rounded-lg border bg-surface-container-high/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="oklch(0.3985 0.015 290.8)" />
          <Controls className="!bg-card !border !border-border" />
          <MiniMap
            className="!bg-card !border !border-border"
            nodeColor={(node) => {
              const task = (node.data as TaskNodeData).task;
              return TASK_STATUS_META[task.status].accent;
            }}
            maskColor="oklch(0.1891 0.0101 285.4 / 0.6)"
          />
        </ReactFlow>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {selected ? <TaskDetailContent task={selected} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
