import { FC } from "react";
import Link from "next/link";
import { Button } from "@zentro/ui/components/shadcn/button";
import { CheckIcon, PlusIcon } from "lucide-react";

import type { DashboardTaskItem } from "~/src/lib/dashboard-data";

type Props = {
  tasks: DashboardTaskItem[];
  tasksHref: string;
};

export const TasksSection: FC<Props> = ({ tasks, tasksHref }) => {
  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">My tasks</h2>
        <Link
          href={tasksHref}
          className="text-sm text-primary hover:text-primary/80"
        >
          View all
        </Link>
      </div>
      {tasks.length ? (
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={task.href}
              className="flex min-w-0 items-center gap-3 py-3 first:pt-0 hover:text-primary"
            >
              <span className="flex size-4 shrink-0 items-center justify-center rounded border border-border">
                {task.status === "done" ? (
                  <CheckIcon className="size-3" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{task.title}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium capitalize ${
                  task.priority === "high"
                    ? "text-red-400"
                    : task.priority === "medium"
                      ? "text-yellow-500"
                      : "text-green-500"
                }`}
              >
                {task.priority}
              </span>
            </Link>
          ))}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start px-0 text-sm font-normal text-primary hover:bg-transparent hover:text-primary/80"
          >
            <Link href={tasksHref}>
              <PlusIcon className="mr-1.5 size-3.5" />
              Add task
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-background/50 px-4 py-8 text-center">
          <p className="text-sm font-medium">No tasks assigned</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tasks assigned to you will appear here.
          </p>
          <Button asChild variant="link" size="sm" className="mt-2">
            <Link href={tasksHref}>Open tasks</Link>
          </Button>
        </div>
      )}
    </section>
  );
};
