import type { TaskPriority, TaskStatus } from "./types";

export const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const statusOrder: TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
];

// Priority is shown in ink, never in a state color: color means state.
export const priorityStyles: Record<TaskPriority, string> = {
  low: "text-ink-3",
  medium: "text-ink-2",
  high: "text-ink",
};

export const statusColors: Record<TaskStatus, { bar: string; css: string }> = {
  backlog: { bar: "bg-status-backlog", css: "var(--status-backlog)" },
  todo: { bar: "bg-status-todo", css: "var(--status-todo)" },
  "in-progress": { bar: "bg-status-progress", css: "var(--status-progress)" },
  review: { bar: "bg-status-review", css: "var(--status-review)" },
  done: { bar: "bg-status-done", css: "var(--status-done)" },
};

export const priorityBars: Record<TaskPriority, string> = {
  high: "bg-ink",
  medium: "bg-ink-2",
  low: "bg-ink-3",
};

export const priorityLabels: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
