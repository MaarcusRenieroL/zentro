import { useState, type DragEvent, type ReactNode } from "react";
import { PlusIcon } from "lucide-react";

import { StatusGlyph } from "@zentro/ui/components/status-glyph";

import { CreateTaskModal } from "../create-task-modal";
import { TaskCard } from "./task-card";
import type { TaskStatus, WorkspaceTask } from "~/src/features/tasks/lib/types";
import { EmptyTasks } from "./empty-tasks";
import { statusLabels } from "~/src/features/tasks/lib/constants";

// Work in motion first, finished work last with a few cards. Backlog only
// gets a column while something is parked in it.
const columns: TaskStatus[] = [
  "in-progress",
  "review",
  "todo",
  "backlog",
  "done",
];
const doneVisible = 3;
import { FC } from "react";

type Props = {
  tasks: WorkspaceTask[];
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
  onTaskCreated?: () => void | Promise<void>;
  empty?: ReactNode;
};

export const TaskBoard: FC<Props> = ({
  tasks,
  onTaskStatusChange,
  onTaskCreated,
  empty,
}) => {
  const [showAllDone, setShowAllDone] = useState(false);

  if (!tasks.length) return empty ?? <EmptyTasks />;

  const shown = columns.filter(
    (status) =>
      status !== "backlog" || tasks.some((task) => task.status === status),
  );

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("text/plain");
    const task = tasks.find((candidate) => candidate.id === taskId);

    if (!task || task.status === status) {
      return;
    }

    onTaskStatusChange?.(task, status);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-[880px] items-start gap-3"
        style={{
          gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))`,
        }}
      >
        {shown.map((status) => {
          const allTasks = tasks.filter((task) => task.status === status);
          const hidden =
            status === "done" && !showAllDone
              ? Math.max(allTasks.length - doneVisible, 0)
              : 0;
          const columnTasks = hidden
            ? allTasks.slice(0, doneVisible)
            : allTasks;

          return (
            <section
              key={status}
              aria-label={statusLabels[status]}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status)}
              className="flex flex-col gap-2 rounded-xl border border-hairline/60 bg-sunken p-2.5"
            >
              <div className="flex h-8 items-center gap-2 px-1.5">
                <StatusGlyph status={status} size={12} decorative />
                <h2 className="text-sm font-semibold text-ink">
                  {statusLabels[status]}
                </h2>
                <span className="font-mono text-xs text-ink-3">
                  {allTasks.length}
                </span>
                <span className="flex-1" />
                <CreateTaskModal
                  defaultStatus={status}
                  onTaskCreated={onTaskCreated}
                  trigger={
                    <button
                      type="button"
                      aria-label={`Create a task in ${statusLabels[status]}`}
                      className="flex size-7 items-center justify-center rounded-sm text-ink-3 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PlusIcon className="size-4" aria-hidden="true" />
                    </button>
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                {columnTasks.length ? (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={Boolean(onTaskStatusChange)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", task.id);
                      }}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-border-default px-3 text-center text-xs text-ink-3">
                    No tasks in {statusLabels[status].toLowerCase()}.
                  </div>
                )}

                {hidden ? (
                  <button
                    type="button"
                    onClick={() => setShowAllDone(true)}
                    className="self-start rounded-sm px-2 py-1 text-left font-mono text-xs text-ink-3 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {hidden} more
                  </button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
