"use client";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { useEffect, useState } from "react";

import { TaskWorkspace } from "~/src/components/workspace/task-workspace";
import { workLogEvents } from "~/src/lib/data";
import { TaskPriority, TaskStatus, type WorkspaceTask } from "~/src/lib/types";

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<WorkspaceTask[] | null>(null);
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

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      try {
        const data = await trpc.task.getTasksByOrgId.query();

        const updatedTasks: WorkspaceTask[] = data.map((task) => ({
          id: task.id,
          key: task.key,

          title: task.name,
          description: task.description ?? "",

          projectSlug: task.projectSlug,
          projectName: task.project,

          status: toTaskStatus(task.status),
          priority: toTaskPriority(task.priority),

          assignee: task.assignee ?? "Unassigned",

          dueDate: task.due ? task.due.toDateString() : "",

          logged: "0",
        }));

        if (isMounted) {
          setTasks(updatedTasks);
        }
      } catch {
        toastError("Error", "Failed to fetch tasks");

        if (isMounted) {
          setTasks([]);
        }
      }
    }

    void fetchTasks();

    return () => {
      isMounted = false;
    };
  }, [trpc]);

  if (!tasks) {
    return null;
  }

  return (
    <TaskWorkspace
      title="Tasks"
      description="Plan, sort, and track every task across your projects."
      tasks={tasks}
      logs={workLogEvents}
      onTaskStatusChange={updateTaskStatus}
    />
  );
}
