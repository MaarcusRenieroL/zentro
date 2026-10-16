import type { TaskPriority, TaskStatus } from "~/src/features/tasks/lib/types";

export type SubtaskItem = {
  id: string;
  key: string;
  taskNumber: number;
  name: string;
  status: string;
  priority: string;
  assignee: string | null;
  due: Date | null;
  createdAt: Date;
};

export type TaskDetail = {
  id: string;
  key: string;
  taskNumber: number;
  name: string;
  description: string | null;
  projectId: string;
  projectName: string;
  projectSlug: string;
  status: string;
  priority: string;
  assignedToMemberId: string | null;
  assignee: string | null;
  teamId: string | null;
  teamName: string | null;
  parentTaskId?: string | null;
  parentTask?: { id: string; key: string; name: string } | null;
  subtasks?: SubtaskItem[];
  reporter: string | null;
  /** Who created the task; `_own` permissions apply to this person. */
  createdByUserId: string | null;
  due: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MemberOption = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type TaskUpdate = {
  name?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToMemberId?: string | null;
  dueAt?: Date | null;
};

export type TaskComment = {
  id: string;
  body: string;
  authorMemberId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  authorImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskActivityEvent = {
  id: string;
  type: string;
  field: string | null;
  fromValue: string | null;
  toValue: string | null;
  commentId: string | null;
  commentBody: string | null;
  actorMemberId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
  createdAt: Date;
};
