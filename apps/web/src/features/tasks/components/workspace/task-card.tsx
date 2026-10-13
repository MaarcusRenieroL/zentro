import { paths } from "~/src/lib/paths";
import Link from "next/link";

import { Badge } from "@zentro/ui/shadcn/badge";
import { cn } from "@zentro/ui/lib/utils";
import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { priorityStyles } from "~/src/features/tasks/lib/constants";
import { FC } from "react";

type Props = {
  task: WorkspaceTask;
};

export const TaskCard: FC<Props> = ({ task }) => {
  return (
    <Link
      href={paths.task(task.key)}
      className="group block rounded-lg border bg-card p-3 shadow-xs transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-5 group-hover:underline">
          {task.title}
        </p>

        <Badge variant="outline" className="shrink-0">
          {task.key}
        </Badge>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
        {task.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{task.projectName}</Badge>
        <Badge variant="outline">{task.teamName ?? "Workspace level"}</Badge>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-muted-foreground">{task.assignee}</span>
        <span
          className={cn(
            "font-medium capitalize",
            priorityStyles[task.priority],
          )}
        >
          {task.priority}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {task.dueDate || "No due date"}
        </span>
      </div>
    </Link>
  );
};
