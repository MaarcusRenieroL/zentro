export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  lead: string;
};

export type WorkspaceTask = {
  id: string;
  key: string;
  title: string;
  description: string;
  projectSlug: string;
  projectName: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  logged: string;
};

export type WorkLogEvent = {
  id: string;
  actor: string;
  action: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  duration: string;
  note: string;
  time: string;
};

export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export type StatusSummary = {
  id: TaskStatus;
  label: string;
  count: number;
  color: string;
};

export type PrioritySummary = {
  id: TaskPriority;
  label: string;
  count: number;
  color: string;
};

export type WorkTypeSummary = {
  id: string;
  label: string;
  count: number;
  color: string;
};
