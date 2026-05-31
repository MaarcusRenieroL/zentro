import { CalendarIcon, CircleDotIcon, FlagIcon } from "lucide-react";

import { Badge } from "@zentro/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";

import type { HomeTask, TaskPriority, TaskStatus } from "./data";

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  "in-progress": "In progress",
  review: "Review",
  done: "Done",
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-destructive",
};

type Props = {
  title: string;
  description: string;
  tasks: HomeTask[];
};

export const TaskList = ({ title, description, tasks }: Props) => {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex min-w-0 items-center gap-3 rounded-md border bg-background p-3"
          >
            <CircleDotIcon className="size-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <Badge
                  variant="outline"
                  className="hidden shrink-0 sm:inline-flex"
                >
                  {task.id}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {task.project}
              </p>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Badge variant="secondary">{statusLabels[task.status]}</Badge>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium capitalize",
                  priorityStyles[task.priority],
                )}
              >
                <FlagIcon className="size-3" />
                {task.priority}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="size-3.5" />
              <span>{task.dueLabel}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
