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
import { formatRelativeTime } from "~/src/features/tasks/lib/format";
import type { TaskPriority, TaskStatus } from "~/src/features/tasks/lib/types";
import { DueDate } from "~/src/components/due-date";
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
    <Card className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 shadow-2xs">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-[15px] font-semibold text-ink">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-ink-3">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-2.5">
        {tasks.length ? (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={paths.task(task.key)}
              className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-hairline/70 bg-surface/40 p-3 transition-all hover:border-signal/40 hover:bg-surface hover:shadow-2xs"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">
                  {task.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">
                  <span className="font-semibold text-ink-2">{task.key}</span> ·{" "}
                  {task.project}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                <Badge
                  variant="secondary"
                  className="rounded-md border-hairline bg-muted/70 px-2 py-0.5 text-[11px] font-medium"
                >
                  {statusLabels[task.status as TaskStatus] ?? task.status}
                </Badge>
                <span
                  className={cn(
                    "text-[11px] text-ink-3",
                    detail === "due" &&
                      priorityStyles[task.priority as TaskPriority],
                  )}
                >
                  {detail === "due" ? (
                    <DueDate value={task.dueAt} className="text-[11px]" />
                  ) : (
                    formatRelativeTime(task.updatedAt)
                  )}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-hairline p-6 text-center text-xs text-ink-3">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
