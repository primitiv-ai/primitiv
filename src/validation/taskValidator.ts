import type { TaskItem } from "../schemas/task.js";

export interface TaskValidationResult {
  valid: boolean;
  errors: string[];
  waves: TaskItem[][];
}

export function validateTaskDependencies(tasks: TaskItem[]): TaskValidationResult {
  const errors: string[] = [];
  const taskIds = new Set(tasks.map(t => t.id));

  // Check for references to non-existent task IDs
  for (const task of tasks) {
    for (const dep of task.dependsOn) {
      if (!taskIds.has(dep)) {
        errors.push(`${task.id} depends on non-existent task ${dep}`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, waves: [] };
  }

  // Detect cycles using DFS
  const cycle = detectCycle(tasks);
  if (cycle) {
    errors.push(`Dependency cycle detected: ${cycle.join(" → ")}`);
    return { valid: false, errors, waves: [] };
  }

  // Compute topological waves
  const waves = computeWaves(tasks);

  return { valid: true, errors: [], waves };
}

function detectCycle(tasks: TaskItem[]): string[] | null {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  for (const task of tasks) {
    color.set(task.id, WHITE);
  }

  for (const task of tasks) {
    if (color.get(task.id) === WHITE) {
      const cycle = dfs(task.id, color, parent, taskMap);
      if (cycle) return cycle;
    }
  }

  return null;
}

function dfs(
  nodeId: string,
  color: Map<string, number>,
  parent: Map<string, string | null>,
  taskMap: Map<string, TaskItem>,
): string[] | null {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  color.set(nodeId, GRAY);

  const task = taskMap.get(nodeId);
  if (!task) return null;

  for (const dep of task.dependsOn) {
    if (color.get(dep) === GRAY) {
      // Found a cycle — reconstruct it
      const cycle = [dep, nodeId];
      let cur = nodeId;
      while (cur !== dep) {
        const p = parent.get(cur);
        if (!p || p === dep) break;
        cycle.push(p);
        cur = p;
      }
      cycle.push(dep);
      return cycle.reverse();
    }
    if (color.get(dep) === WHITE) {
      parent.set(dep, nodeId);
      const cycle = dfs(dep, color, parent, taskMap);
      if (cycle) return cycle;
    }
  }

  color.set(nodeId, BLACK);
  return null;
}

function computeWaves(tasks: TaskItem[]): TaskItem[][] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const assigned = new Map<string, number>();
  const waves: TaskItem[][] = [];

  function getWave(taskId: string): number {
    if (assigned.has(taskId)) return assigned.get(taskId)!;

    const task = taskMap.get(taskId)!;
    if (task.dependsOn.length === 0) {
      assigned.set(taskId, 0);
      return 0;
    }

    const maxDepWave = Math.max(...task.dependsOn.map(dep => getWave(dep)));
    const wave = maxDepWave + 1;
    assigned.set(taskId, wave);
    return wave;
  }

  for (const task of tasks) {
    getWave(task.id);
  }

  for (const task of tasks) {
    const wave = assigned.get(task.id)!;
    while (waves.length <= wave) waves.push([]);
    waves[wave].push(task);
  }

  return waves;
}
