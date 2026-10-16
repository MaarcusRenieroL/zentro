export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type WorkspaceTask = {
  id: string;
  key: string;
  title: string;
  description: string;
  projectSlug: string;
  projectName: string;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  /** The assignee's user, to tell "my" tasks apart; null when unassigned. */
  assigneeUserId: string | null;
  dueDate: string;
  // ISO timestamp of the due date; null when the task has none.
  dueAt: string | null;
  /** Keys of open tasks that block this one. */
  blockedBy: string[];
  parentTaskId?: string | null;
  subtaskCount?: { total: number; done: number } | null;
};

/** A change made to several tasks at once from the selection bar. */
export type BulkChange =
  | { status: TaskStatus }
  | {
      assignedToMemberId: string | null;
      assignee: string;
      assigneeUserId: string | null;
    }
  | { dueAt: string | null };

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
};

export type PrioritySummary = {
  id: TaskPriority;
  label: string;
  count: number;
};
