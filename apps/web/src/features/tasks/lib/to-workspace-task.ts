import type { TaskPriority, TaskStatus, WorkspaceTask } from "./types";

const statuses = ["backlog", "todo", "in-progress", "review", "done"];
const priorities = ["low", "medium", "high"];

type ApiTask = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  projectSlug: string;
  project: string;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
  status: string;
  priority: string;
  assignee?: string | null;
  assigneeUserId?: string | null;
  due?: Date | null;
  blockedBy?: string[];
};

/** One API task as the task list renders it. */
export function toWorkspaceTask(task: ApiTask): WorkspaceTask {
  return {
    id: task.id,
    key: task.key,
    title: task.name,
    description: task.description ?? "",
    projectSlug: task.projectSlug,
    projectName: task.project,
    teamId: task.teamId,
    teamName: task.teamName,
    teamColor: task.teamColor,
    status: (statuses.includes(task.status)
      ? task.status
      : "todo") as TaskStatus,
    priority: (priorities.includes(task.priority)
      ? task.priority
      : "medium") as TaskPriority,
    assignee: task.assignee ?? "Unassigned",
    assigneeUserId: task.assigneeUserId ?? null,
    dueDate: task.due ? task.due.toDateString() : "",
    dueAt: task.due ? task.due.toISOString() : null,
    blockedBy: task.blockedBy ?? [],
  };
}
