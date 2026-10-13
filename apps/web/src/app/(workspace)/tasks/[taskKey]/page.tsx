"use client";

import { paths } from "~/src/lib/paths";
import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";

import { TaskDetailView } from "~/src/features/tasks/components/task-detail/task-detail-view";
import type {
  MemberOption,
  TaskActivityEvent,
  TaskComment,
  TaskDetail,
  TaskUpdate,
} from "~/src/features/tasks/components/task-detail/types";

export default function TaskDetailPage() {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activityEvents, setActivityEvents] = useState<TaskActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);
  const { taskKey } = useParams<{ taskKey: string }>();
  const router = useRouter();

  const trpc = useTrpcClient();

  const selectedAssignee = useMemo(() => {
    if (!task?.assignedToMemberId) {
      return null;
    }

    return members.find((member) => member.id === task.assignedToMemberId);
  }, [members, task?.assignedToMemberId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchTask() {
      try {
        const [taskData, memberData] = await Promise.all([
          trpc.task.getTaskByKey.query({ key: taskKey }),
          trpc.member.getMembers.query(),
        ]);

        if (!isMounted) {
          return;
        }

        if (!taskData) {
          toastError("Error", "Task was not found");
          setTask(null);
          setMembers(memberData);
          setComments([]);
          setActivityEvents([]);
          return;
        }

        const [commentData, activityData] = await Promise.all([
          trpc.comment.getTaskComments.query({ taskKey }),
          trpc.activity.getTaskActivityEvents.query({ taskKey }),
        ]);

        if (!isMounted) {
          return;
        }

        setTask(taskData);
        setMembers(memberData);
        setComments(commentData);
        setActivityEvents(activityData);
      } catch {
        toastError("Error", "Failed to fetch task details");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchTask();

    return () => {
      isMounted = false;
    };
  }, [taskKey, trpc]);

  async function saveTask(field: string, values: TaskUpdate) {
    if (!task || savingField) {
      return;
    }

    try {
      setSavingField(field);

      const updatedTask = await trpc.task.updateTaskByKey.mutate({
        key: task.key,
        ...values,
      });

      if (updatedTask) {
        // The update response has no reporter; it cannot change, so keep it.
        setTask({ ...updatedTask, reporter: task.reporter });
        await refreshTaskActivity();
        toastSuccess("Task updated");
      }
    } catch {
      toastError("Error", "Failed to update task");
    } finally {
      setSavingField(null);
    }
  }

  async function deleteTask() {
    if (!task || savingField) {
      return;
    }

    try {
      setSavingField("delete");
      await trpc.task.deleteTaskByKey.mutate({ key: task.key });
      toastSuccess("Task deleted");
      router.push(paths.tasks());
    } catch {
      toastError("Error", "Failed to delete task");
    } finally {
      setSavingField(null);
    }
  }

  async function addComment(body: string) {
    if (!task || savingField) {
      return;
    }

    try {
      setSavingField("comment");
      await trpc.comment.createTaskComment.mutate({
        taskKey: task.key,
        body,
      });
      await refreshTaskActivity();
      toastSuccess("Comment added");
    } catch {
      toastError("Error", "Failed to add comment");
    } finally {
      setSavingField(null);
    }
  }

  async function refreshTaskActivity() {
    if (!task) {
      return;
    }

    const [commentData, activityData] = await Promise.all([
      trpc.comment.getTaskComments.query({ taskKey: task.key }),
      trpc.activity.getTaskActivityEvents.query({ taskKey: task.key }),
    ]);

    setComments(commentData);
    setActivityEvents(activityData);
  }

  if (isLoading) {
    return <TaskDetailLoading />;
  }

  if (!task) {
    return <TaskDetailNotFound />;
  }

  return (
    <TaskDetailView
      task={task}
      members={members}
      selectedAssignee={selectedAssignee}
      savingField={savingField}
      onSave={saveTask}
      onDelete={deleteTask}
      comments={comments}
      activityEvents={activityEvents}
      onAddComment={addComment}
    />
  );
}

function TaskDetailLoading() {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <div className="h-8 w-72 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="h-[520px] animate-pulse rounded-md bg-muted" />
        <div className="h-[620px] animate-pulse rounded-md bg-muted" />
      </div>
    </section>
  );
}

function TaskDetailNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-[900px] flex-col gap-4 px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={paths.tasks()}>
          <ArrowLeftIcon className="size-4" />
          Back to tasks
        </Link>
      </Button>
      <div className="rounded-md border bg-card p-8">
        <h1 className="text-xl font-semibold">Task not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This task may have been moved, deleted, or created in another
          organization.
        </p>
      </div>
    </section>
  );
}
