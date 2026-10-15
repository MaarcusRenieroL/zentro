"use client";

import { useTrpcClient } from "@zentro/api/react";
import { ErrorState } from "@zentro/ui/components/error-state";
import { BoardSkeleton, PageSkeleton } from "@zentro/ui/components/skeletons";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TaskWorkspace } from "~/src/features/tasks/components/workspace/task-workspace";
import {
  TaskPriority,
  TaskStatus,
  type WorkspaceTask,
} from "~/src/features/tasks/lib/types";

const taskStatuses = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
] as const;
const taskPriorities = ["low", "medium", "high"] as const;

function toTaskStatus(value: string): TaskStatus {
  return taskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "todo";
}

function toTaskPriority(value: string): TaskPriority {
  return taskPriorities.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "medium";
}

function toInitialStatus(value: string | null): TaskStatus | "all" {
  return taskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "all";
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

  async function updateTasksStatus(
    selected: WorkspaceTask[],
    status: TaskStatus,
  ) {
    const targets = selected.filter((task) => task.status !== status);

    if (!targets.length) return;

    const ids = new Set(targets.map((task) => task.id));

    setTasks(
      (current) =>
        current?.map((task) =>
          ids.has(task.id) ? { ...task, status } : task,
        ) ?? null,
    );

    const results = await Promise.allSettled(
      targets.map((task) =>
        trpc.task.updateTaskByKey.mutate({ key: task.key, status }),
      ),
    );
    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length) {
      toastError(
        "Some tasks did not move",
        `${failed.length} of ${targets.length} could not be updated.`,
      );
      setRefreshToken((token) => token + 1);
    } else {
      toastSuccess(
        targets.length === 1 ? "Task moved" : `${targets.length} tasks moved`,
      );
    }
  }

  const fetchTasks = useCallback(async () => {
    const data = await trpc.task.getTasksByOrgId.query({});

    return data.map((task) => ({
      id: task.id,
      key: task.key,

      title: task.name,
      description: task.description ?? "",

      projectSlug: task.projectSlug,
      projectName: task.project,
      teamId: task.teamId,
      teamName: task.teamName,
      teamColor: task.teamColor,

      status: toTaskStatus(task.status),
      priority: toTaskPriority(task.priority),

      assignee: task.assignee ?? "Unassigned",

      dueDate: task.due ? task.due.toDateString() : "",
      dueAt: task.due ? task.due.toISOString() : null,
    }));
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
        className="mt-10"
        title="Tasks could not be loaded"
        message="We could not read your tasks. They are safe; try again."
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
        <BoardSkeleton />
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
      onTasksStatusChange={updateTasksStatus}
      onTaskCreated={() => setRefreshToken((token) => token + 1)}
    />
  );
}
