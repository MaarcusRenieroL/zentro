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

export const priorityStyles: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

export const statusColors: Record<TaskStatus, { bar: string; css: string }> = {
  backlog: { bar: "bg-slate-300", css: "var(--color-slate-300)" },
  todo: { bar: "bg-slate-400", css: "var(--color-slate-400)" },
  "in-progress": { bar: "bg-blue-500", css: "var(--color-blue-500)" },
  review: { bar: "bg-amber-500", css: "var(--color-amber-500)" },
  done: { bar: "bg-emerald-500", css: "var(--color-emerald-500)" },
};

export const priorityBars: Record<TaskPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export const priorityLabels: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
