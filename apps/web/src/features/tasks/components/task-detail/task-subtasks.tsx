"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckSquareIcon, PlusIcon, Loader2Icon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { paths } from "~/src/lib/paths";
import { ActorAvatar } from "~/src/components/actor-avatar";

import type { SubtaskItem, TaskDetail } from "./types";

export function TaskSubtasks({
  task,
  canEdit,
  onSubtaskChanged,
}: {
  task: TaskDetail;
  canEdit: boolean;
  onSubtaskChanged?: () => void;
}) {
  const trpc = useTrpcClient();
  const [items, setItems] = useState<SubtaskItem[]>(task.subtasks ?? []);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const total = items.length;
  const doneCount = items.filter((item) => item.status === "done").length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  async function toggleStatus(subtask: SubtaskItem) {
    const nextStatus = subtask.status === "done" ? "todo" : "done";
    setLoadingKey(subtask.key);

    setItems((prev) =>
      prev.map((item) =>
        item.id === subtask.id ? { ...item, status: nextStatus } : item,
      ),
    );

    try {
      await trpc.task.updateTaskByKey.mutate({
        key: subtask.key,
        status: nextStatus as any,
      });
      toastSuccess(
        nextStatus === "done" ? "Subtask completed" : "Subtask reopened",
      );
      onSubtaskChanged?.();
    } catch {
      toastError("Error", "Could not update subtask");
      setItems((prev) =>
        prev.map((item) =>
          item.id === subtask.id ? { ...item, status: subtask.status } : item,
        ),
      );
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || isCreating) return;

    setIsCreating(true);
    try {
      const created = await trpc.task.createSubtask.mutate({
        parentTaskKey: task.key,
        name: title,
      });

      setItems((prev) => [
        ...prev,
        {
          id: created.id,
          key: created.key,
          taskNumber: created.taskNumber,
          name: created.name,
          status: created.status,
          priority: created.priority,
          assignee: null,
          due: created.dueAt ? new Date(created.dueAt) : null,
          createdAt: new Date(created.createdAt),
        },
      ]);
      setNewTitle("");
      toastSuccess("Subtask added");
      onSubtaskChanged?.();
    } catch {
      toastError("Error", "Could not create subtask");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section aria-label="Subtasks" className="tile p-5">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CheckSquareIcon className="size-4 text-ink-3" aria-hidden="true" />
          <h2 className="eyebrow text-ink">Subtasks</h2>
          {total > 0 && (
            <span className="font-mono text-xs text-ink-3">
              {doneCount}/{total}
            </span>
          )}
        </div>
        {total > 0 && (
          <span className="font-mono text-xs font-medium text-ink-2">
            {percent}%
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-hairline">
          {items.map((subtask) => {
            const isDone = subtask.status === "done";
            const isLoading = loadingKey === subtask.key;

            return (
              <li
                key={subtask.id}
                className="group flex items-center gap-2.5 py-2 text-sm"
              >
                <button
                  type="button"
                  disabled={!canEdit || isLoading}
                  onClick={() => toggleStatus(subtask)}
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-hairline hover:border-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={`Mark ${subtask.key} as ${isDone ? "todo" : "done"}`}
                >
                  {isLoading ? (
                    <Loader2Icon className="size-3 animate-spin text-ink-3" />
                  ) : (
                    <StatusGlyph status={subtask.status} size={11} decorative />
                  )}
                </button>

                <span className="w-14 shrink-0 font-mono text-xs text-ink-3">
                  {subtask.key}
                </span>

                <Link
                  href={paths.task(subtask.key)}
                  className={cn(
                    "min-w-0 flex-1 truncate text-ink outline-none hover:underline focus-visible:ring-1 focus-visible:ring-ring",
                    isDone && "text-ink-3 line-through",
                  )}
                >
                  {subtask.name}
                </Link>

                {subtask.assignee ? (
                  <span title={subtask.assignee}>
                    <ActorAvatar name={subtask.assignee} size={20} />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {canEdit && (
        <form onSubmit={handleCreate} className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a subtask..."
              disabled={isCreating}
              className="h-8 w-full rounded-md border border-hairline bg-surface-subtle px-2.5 text-xs text-ink placeholder:text-ink-3 focus:border-ink-3 focus:bg-surface focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim() || isCreating}
            className="flex h-8 items-center gap-1 rounded-md border border-hairline px-2.5 text-xs font-medium text-ink-2 hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            {isCreating ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <PlusIcon className="size-3.5" />
            )}
            <span>Add</span>
          </button>
        </form>
      )}
    </section>
  );
}
