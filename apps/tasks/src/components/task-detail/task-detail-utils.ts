import type { TaskPriority, TaskStatus } from "~/src/lib/types";

export const taskStatuses = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
] as const;

export const taskPriorities = ["low", "medium", "high"] as const;
export const unassignedValue = "__unassigned__";

export function toTaskStatus(value: string): TaskStatus {
  return taskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "todo";
}

export function toTaskPriority(value: string): TaskPriority {
  return taskPriorities.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "medium";
}

export function getDateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function formatDate(value: Date | null) {
  if (!value) {
    return "None";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function getInitials(value: string | null | undefined) {
  if (!value) {
    return "UN";
  }

  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
