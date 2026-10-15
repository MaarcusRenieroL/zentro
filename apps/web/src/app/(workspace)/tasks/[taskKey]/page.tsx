"use client";

import { paths } from "~/src/lib/paths";
import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { ErrorState } from "@zentro/ui/components/error-state";
import { DetailSkeleton } from "@zentro/ui/components/skeletons";

import { NotFoundContent } from "~/src/components/system/not-found-content";
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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [savingField, setSavingField] = useState<string | null>(null);
  const { taskKey } = useParams<{ taskKey: string }>();
  const router = useRouter();

  const trpc = useTrpcClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchTask() {
      try {
        const [taskData, memberData] = await Promise.all([
          trpc.task.getTaskByKey.query({ key: taskKey }),
          // Needs members.view; people with only a project role get no list.
          trpc.member.getMembers.query().catch(() => []),
        ]);

        if (!isMounted) {
          return;
        }

        setFailed(false);

        if (!taskData) {
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
        if (isMounted) {
          setFailed(true);
        }
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
  }, [taskKey, trpc, attempt]);

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
        // The update response has no reporter or creator; they cannot change.
        setTask({
          ...updatedTask,
          reporter: task.reporter,
          createdByUserId: task.createdByUserId,
        });
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
    return <DetailSkeleton />;
  }

  if (failed) {
    return (
      <ErrorState
        className="mt-10"
        title="This task could not be loaded"
        message="We could not read it right now. Try again."
        onRetry={() => {
          setIsLoading(true);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!task) {
    return <TaskDetailNotFound taskKey={decodeURIComponent(taskKey)} />;
  }

  return (
    <TaskDetailView
      task={task}
      members={members}
      savingField={savingField}
      onSave={saveTask}
      onDelete={deleteTask}
      comments={comments}
      activityEvents={activityEvents}
      onAddComment={addComment}
    />
  );
}

function TaskDetailNotFound({ taskKey }: { taskKey: string }) {
  return (
    <NotFoundContent
      inShell
      description={`${taskKey} doesn’t exist, or it was deleted. It may also belong to another organization.`}
    />
  );
}
