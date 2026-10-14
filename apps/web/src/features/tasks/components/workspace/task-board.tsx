import type { DragEvent } from "react";
import { PlusIcon } from "lucide-react";

import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Button } from "@zentro/ui/shadcn/button";

import { CreateTaskModal } from "../create-task-modal";
import { TaskCard } from "./task-card";
import type { TaskStatus, WorkspaceTask } from "~/src/features/tasks/lib/types";
import { EmptyTasks } from "./empty-tasks";
import { statusLabels, statusOrder } from "~/src/features/tasks/lib/constants";
import { FC } from "react";

type Props = {
  tasks: WorkspaceTask[];
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
  onTaskCreated?: () => void | Promise<void>;
};

export const TaskBoard: FC<Props> = ({
  tasks,
  onTaskStatusChange,
  onTaskCreated,
}) => {
  if (!tasks.length) return <EmptyTasks />;

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
      <div className="grid min-w-[1100px] grid-cols-5 gap-3">
        {statusOrder.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);

          return (
            <section
              key={status}
              aria-label={statusLabels[status]}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status)}
              className="flex min-h-[520px] flex-col rounded-xl bg-sunken p-2.5"
            >
              <div className="mb-2.5 flex items-center gap-2 px-2 pt-1">
                <StatusGlyph status={status} size={16} decorative />
                <h2 className="text-sm font-semibold text-ink">
                  {statusLabels[status]}
                </h2>
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-2 tabular-nums">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2.5">
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
                  <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-border-default px-3 text-center text-xs text-ink-3">
                    No tasks in {statusLabels[status].toLowerCase()}.
                  </div>
                )}

                <CreateTaskModal
                  defaultStatus={status}
                  onTaskCreated={onTaskCreated}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-auto w-full justify-start rounded-xl text-ink-2"
                    >
                      <PlusIcon className="size-4" />
                      Create task
                    </Button>
                  }
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
