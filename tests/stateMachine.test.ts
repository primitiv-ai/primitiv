import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, getNextStatuses, isTerminal, getStatusIndex } from "../src/state/specStateMachine.js";
import { InvalidTransitionError } from "../src/utils/errors.js";

describe("specStateMachine", () => {
  it("allows valid transitions", () => {
    expect(canTransition("draft", "gate-1-passed")).toBe(true);
    expect(canTransition("gate-1-passed", "gate-2-passed")).toBe(true);
    expect(canTransition("gate-2-passed", "gate-3-passed")).toBe(true);
    expect(canTransition("gate-3-passed", "clarified")).toBe(true);
    expect(canTransition("gate-3-passed", "planned")).toBe(true);
    expect(canTransition("clarified", "planned")).toBe(true);
    expect(canTransition("planned", "tasked")).toBe(true);
    expect(canTransition("tasked", "in-progress")).toBe(true);
    expect(canTransition("in-progress", "tested")).toBe(true);
    expect(canTransition("in-progress", "completed")).toBe(true);
    expect(canTransition("tested", "completed")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("draft", "completed")).toBe(false);
    expect(canTransition("draft", "planned")).toBe(false);
    expect(canTransition("completed", "draft")).toBe(false);
    expect(canTransition("gate-1-passed", "gate-3-passed")).toBe(false);
    expect(canTransition("tested", "in-progress")).toBe(false);
    expect(canTransition("draft", "tested")).toBe(false);
  });

  it("assertTransition throws on invalid transition", () => {
    expect(() => assertTransition("draft", "completed")).toThrow(InvalidTransitionError);
  });

  it("assertTransition passes on valid transition", () => {
    expect(() => assertTransition("draft", "gate-1-passed")).not.toThrow();
  });

  it("getNextStatuses returns valid next states", () => {
    expect(getNextStatuses("draft")).toEqual(["gate-1-passed"]);
    expect(getNextStatuses("gate-3-passed")).toEqual(["clarified", "planned"]);
    expect(getNextStatuses("in-progress")).toEqual(["tested", "completed"]);
    expect(getNextStatuses("tested")).toEqual(["completed"]);
    expect(getNextStatuses("completed")).toEqual([]);
  });

  it("isTerminal identifies completed as terminal", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("draft")).toBe(false);
    expect(isTerminal("in-progress")).toBe(false);
  });

  it("getStatusIndex returns correct order", () => {
    expect(getStatusIndex("draft")).toBe(0);
    expect(getStatusIndex("tested")).toBe(8);
    expect(getStatusIndex("completed")).toBe(9);
    expect(getStatusIndex("planned")).toBeLessThan(getStatusIndex("tasked"));
    expect(getStatusIndex("in-progress")).toBeLessThan(getStatusIndex("tested"));
  });
});
