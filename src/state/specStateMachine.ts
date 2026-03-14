import type { SpecStatus } from "../schemas/common.js";
import { InvalidTransitionError } from "../utils/errors.js";

// Valid transitions: each key maps to allowed next statuses
const TRANSITIONS: Record<SpecStatus, SpecStatus[]> = {
  "draft": ["gate-1-passed"],
  "gate-1-passed": ["gate-2-passed"],
  "gate-2-passed": ["gate-3-passed"],
  "gate-3-passed": ["clarified", "planned"],
  "clarified": ["planned"],
  "planned": ["tasked"],
  "tasked": ["in-progress"],
  "in-progress": ["tested", "completed"],
  "tested": ["completed"],
  "completed": [],
};

export function canTransition(from: SpecStatus, to: SpecStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: SpecStatus, to: SpecStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function getNextStatuses(current: SpecStatus): SpecStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function isTerminal(status: SpecStatus): boolean {
  return status === "completed";
}

export function getStatusIndex(status: SpecStatus): number {
  const order: SpecStatus[] = [
    "draft", "gate-1-passed", "gate-2-passed", "gate-3-passed",
    "clarified", "planned", "tasked", "in-progress", "tested", "completed",
  ];
  return order.indexOf(status);
}
