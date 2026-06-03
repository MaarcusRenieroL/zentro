import type { DragEvent } from "react";
import { PlusIcon } from "lucide-react";

import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Card, CardContent } from "@zentro/ui/shadcn/card";

import { TaskCard } from "./task-card";
import type { TaskStatus, WorkspaceTask } from "~/src/lib/types";
import { EmptyTasks } from "./empty-tasks";
import { statusLabels, statusOrder } from "~/src/lib/constants";
import { FC } from "react";

type Props = {
  tasks: WorkspaceTask[];
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
};

export const TaskBoard: FC<Props> = ({ tasks, onTaskStatusChange }) => {
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
    <Card className="rounded-lg">
      <CardContent className="overflow-x-auto p-3">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {statusOrder.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);

            return (
              <section
                key={status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, status)}
                className="flex min-h-[520px] flex-col rounded-lg border bg-muted/30 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {statusLabels[status]}
                  </h2>

                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </div>

                <div className="flex flex-1 flex-col gap-2">
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
                    <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-background/60 px-3 text-center text-xs text-muted-foreground">
                      No tasks in {statusLabels[status].toLowerCase()}.
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-auto w-full justify-start text-muted-foreground"
                  >
                    <PlusIcon className="size-4" />
                    Create task
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
