import { FC } from "react";
import Link from "next/link";

import { Badge } from "@zentro/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";

import {
  priorityStyles,
  statusLabels,
} from "~/src/features/tasks/lib/constants";
import {
  formatRelativeTime,
  formatShortDate,
} from "~/src/features/tasks/lib/format";
import type { TaskPriority, TaskStatus } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

export type OverviewTask = {
  id: string;
  key: string;
  name: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  updatedAt: Date;
  project: string;
};

type Props = {
  title: string;
  description: string;
  tasks: OverviewTask[];
  emptyMessage: string;
  detail: "due" | "updated";
};

export const TaskListCard: FC<Props> = ({
  title,
  description,
  tasks,
  emptyMessage,
  detail,
}) => {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={paths.task(task.key)}
              className="flex min-w-0 items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{task.name}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {task.key} · {task.project}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                <Badge variant="secondary">
                  {statusLabels[task.status as TaskStatus] ?? task.status}
                </Badge>
                <span
                  className={cn(
                    "capitalize text-muted-foreground",
                    detail === "due" &&
                      priorityStyles[task.priority as TaskPriority],
                  )}
                >
                  {detail === "due"
                    ? task.dueAt
                      ? `Due ${formatShortDate(task.dueAt)}`
                      : "No due date"
                    : formatRelativeTime(task.updatedAt)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
