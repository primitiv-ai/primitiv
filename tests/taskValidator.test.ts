import { describe, it, expect } from "vitest";
import { validateTaskDependencies } from "../src/validation/taskValidator.js";
import type { TaskItem } from "../src/schemas/task.js";

function makeTask(overrides: Partial<TaskItem> & { id: string }): TaskItem {
  return {
    title: overrides.id,
    status: "pending",
    files: [],
    acceptanceCriteria: [],
    dependsOn: [],
    ...overrides,
  };
}

describe("validateTaskDependencies", () => {
  it("validates tasks with no dependencies (all wave 0)", () => {
    const tasks = [
      makeTask({ id: "TASK-001" }),
      makeTask({ id: "TASK-002" }),
      makeTask({ id: "TASK-003" }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(true);
    expect(result.waves).toHaveLength(1);
    expect(result.waves[0]).toHaveLength(3);
  });

  it("computes correct wave ordering", () => {
    const tasks = [
      makeTask({ id: "TASK-001", dependsOn: [] }),
      makeTask({ id: "TASK-002", dependsOn: [] }),
      makeTask({ id: "TASK-003", dependsOn: ["TASK-001", "TASK-002"] }),
      makeTask({ id: "TASK-004", dependsOn: ["TASK-003"] }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(true);
    expect(result.waves).toHaveLength(3);
    expect(result.waves[0].map(t => t.id).sort()).toEqual(["TASK-001", "TASK-002"]);
    expect(result.waves[1].map(t => t.id)).toEqual(["TASK-003"]);
    expect(result.waves[2].map(t => t.id)).toEqual(["TASK-004"]);
  });

  it("detects references to non-existent tasks", () => {
    const tasks = [
      makeTask({ id: "TASK-001", dependsOn: ["TASK-999"] }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("TASK-999");
  });

  it("detects simple cycles", () => {
    const tasks = [
      makeTask({ id: "TASK-001", dependsOn: ["TASK-002"] }),
      makeTask({ id: "TASK-002", dependsOn: ["TASK-001"] }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("cycle");
  });

  it("detects self-referencing cycle", () => {
    const tasks = [
      makeTask({ id: "TASK-001", dependsOn: ["TASK-001"] }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("cycle");
  });

  it("detects longer cycles", () => {
    const tasks = [
      makeTask({ id: "TASK-001", dependsOn: ["TASK-003"] }),
      makeTask({ id: "TASK-002", dependsOn: ["TASK-001"] }),
      makeTask({ id: "TASK-003", dependsOn: ["TASK-002"] }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("cycle");
  });

  it("handles empty task list", () => {
    const result = validateTaskDependencies([]);
    expect(result.valid).toBe(true);
    expect(result.waves).toEqual([]);
  });

  it("handles single task", () => {
    const tasks = [makeTask({ id: "TASK-001" })];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(true);
    expect(result.waves).toHaveLength(1);
    expect(result.waves[0]).toHaveLength(1);
  });

  it("handles diamond dependency pattern", () => {
    //   1
    //  / \
    // 2   3
    //  \ /
    //   4
    const tasks = [
      makeTask({ id: "TASK-001", dependsOn: [] }),
      makeTask({ id: "TASK-002", dependsOn: ["TASK-001"] }),
      makeTask({ id: "TASK-003", dependsOn: ["TASK-001"] }),
      makeTask({ id: "TASK-004", dependsOn: ["TASK-002", "TASK-003"] }),
    ];
    const result = validateTaskDependencies(tasks);
    expect(result.valid).toBe(true);
    expect(result.waves).toHaveLength(3);
    expect(result.waves[0].map(t => t.id)).toEqual(["TASK-001"]);
    expect(result.waves[1].map(t => t.id).sort()).toEqual(["TASK-002", "TASK-003"]);
    expect(result.waves[2].map(t => t.id)).toEqual(["TASK-004"]);
  });
});
