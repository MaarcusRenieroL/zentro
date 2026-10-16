"use client";

import { useTrpcClient } from "@zentro/api/react";
import { ErrorState } from "@zentro/ui/components/error-state";
import { ListSkeleton, PageSkeleton } from "@zentro/ui/components/skeletons";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TaskWorkspace } from "~/src/features/tasks/components/workspace/task-workspace";
import { toWorkspaceTask } from "~/src/features/tasks/lib/to-workspace-task";
import {
  TaskStatus,
  type BulkChange,
  type WorkspaceTask,
} from "~/src/features/tasks/lib/types";

const taskStatuses = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
] as const;

function toInitialStatus(value: string | null): TaskStatus | "all" {
  return taskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "all";
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : `${count} ${many}`;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? undefined;
  const initialStatus = toInitialStatus(searchParams.get("status"));
  const [tasks, setTasks] = useState<WorkspaceTask[] | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [failed, setFailed] = useState(false);
  const trpc = useTrpcClient();

  async function updateTaskStatus(task: WorkspaceTask, status: TaskStatus) {
    if (task.status === status) {
      return;
    }

    setTasks(
      (currentTasks) =>
        currentTasks?.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                status,
              }
            : currentTask,
        ) ?? null,
    );

    try {
      await trpc.task.updateTaskByKey.mutate({
        key: task.key,
        status,
      });
      toastSuccess("Task moved");
    } catch {
      setTasks(
        (currentTasks) =>
          currentTasks?.map((currentTask) =>
            currentTask.id === task.id
              ? {
                  ...currentTask,
                  status: task.status,
                }
              : currentTask,
          ) ?? null,
      );
      toastError("Error", "Failed to update task status");
    }
  }

  // One change applied to every selected task, optimistically; whatever the
  // server refuses is reloaded from the server.
  async function updateTasks(selected: WorkspaceTask[], change: BulkChange) {
    const targets = selected.filter((task) =>
      "status" in change
        ? task.status !== change.status
        : "dueAt" in change
          ? task.dueAt !== change.dueAt
          : "priority" in change
            ? task.priority !== change.priority
            : "estimatePoints" in change
              ? task.estimatePoints !== change.estimatePoints
              : task.assigneeUserId !== change.assigneeUserId,
    );

    if (!targets.length) return;

    const ids = new Set(targets.map((task) => task.id));
    const patch: Partial<WorkspaceTask> =
      "status" in change
        ? { status: change.status }
        : "dueAt" in change
          ? {
              dueAt: change.dueAt,
              dueDate: change.dueAt
                ? new Date(change.dueAt).toDateString()
                : "",
            }
          : "priority" in change
            ? { priority: change.priority }
            : "estimatePoints" in change
              ? { estimatePoints: change.estimatePoints }
              : {
                  assignee: change.assignee,
                  assigneeUserId: change.assigneeUserId,
                };

    setTasks(
      (current) =>
        current?.map((task) =>
          ids.has(task.id) ? { ...task, ...patch } : task,
        ) ?? null,
    );

    const input =
      "status" in change
        ? { status: change.status }
        : "dueAt" in change
          ? { dueAt: change.dueAt ? new Date(change.dueAt) : null }
          : "priority" in change
            ? { priority: change.priority }
            : "estimatePoints" in change
              ? { estimatePoints: change.estimatePoints }
              : { assignedToMemberId: change.assignedToMemberId };
    const results = await Promise.allSettled(
      targets.map((task) =>
        trpc.task.updateTaskByKey.mutate({ key: task.key, ...input }),
      ),
    );
    const rejected = results.filter((result) => result.status === "rejected");

    if (rejected.length) {
      toastError(
        "Some tasks did not change",
        `${rejected.length} of ${targets.length} could not be updated.`,
      );
      setRefreshToken((token) => token + 1);
    } else {
      toastSuccess(
        `${plural(targets.length, "Task", "tasks")} ${
          "status" in change
            ? "moved"
            : "dueAt" in change
              ? "rescheduled"
              : "reassigned"
        }`,
      );
    }
  }

  async function deleteTasks(selected: WorkspaceTask[]) {
    if (!selected.length) return;

    const ids = new Set(selected.map((task) => task.id));

    setTasks((current) => current?.filter((task) => !ids.has(task.id)) ?? null);

    const results = await Promise.allSettled(
      selected.map((task) =>
        trpc.task.deleteTaskByKey.mutate({ key: task.key }),
      ),
    );
    const rejected = results.filter((result) => result.status === "rejected");

    if (rejected.length) {
      toastError(
        "Some tasks were not deleted",
        `${rejected.length} of ${selected.length} could not be deleted.`,
      );
      setRefreshToken((token) => token + 1);
    } else {
      toastSuccess(`${plural(selected.length, "Task", "tasks")} deleted`);
    }
  }

  const fetchTasks = useCallback(async () => {
    const data = await trpc.task.getTasksByOrgId.query({});

    return data.map(toWorkspaceTask);
  }, [trpc]);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      try {
        const updatedTasks = await fetchTasks();
        if (isMounted) {
          setFailed(false);
          setTasks(updatedTasks);
        }
      } catch {
        if (isMounted) {
          setFailed(true);
        }
      }
    }

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [fetchTasks, refreshToken]);

  if (failed && !tasks) {
    return (
      <ErrorState
        className="mt-10 rounded-xl"
        title="We couldn’t load your tasks."
        message="Your tasks are safe. Try again, and if it keeps happening, tell us when it started."
        onRetry={() => {
          setFailed(false);
          setRefreshToken((token) => token + 1);
        }}
      />
    );
  }

  if (!tasks) {
    return (
      <PageSkeleton toolbar>
        <ListSkeleton
          rows={10}
          className="divide-y-0 rounded-none border-0 bg-transparent"
        />
      </PageSkeleton>
    );
  }

  const projectName = projectSlug
    ? tasks.find((task) => task.projectSlug === projectSlug)?.projectName
    : undefined;

  return (
    <TaskWorkspace
      key={`${projectSlug ?? ""}:${initialStatus}`}
      title={projectName ?? "Tasks"}
      tasks={tasks}
      projectSlug={projectSlug}
      initialStatus={initialStatus}
      onTaskStatusChange={updateTaskStatus}
      onTasksChange={updateTasks}
      onTasksDelete={deleteTasks}
      onTaskCreated={() => setRefreshToken((token) => token + 1)}
    />
  );
}
