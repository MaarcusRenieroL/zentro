import { FC } from "react";
import Link from "next/link";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Checkbox } from "@zentro/ui/components/shadcn/checkbox";
import { PlusIcon } from "lucide-react";

export const TasksSection: FC = () => {
  const myTasks = [
    {
      id: "1",
      title: "Review landing page copy",
      priority: "High",
      completed: false,
    },
    {
      id: "2",
      title: "Finalize API integration",
      priority: "High",
      completed: false,
    },
    {
      id: "3",
      title: "Update user permissions",
      priority: "Medium",
      completed: false,
    },
    {
      id: "4",
      title: "Fix mobile navigation bug",
      priority: "Low",
      completed: false,
    },
  ];

  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">My tasks</h2>
        <Link
          href="/tasks"
          className="text-sm text-primary hover:text-primary/80"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-border">
        {myTasks.map((task) => (
          <div
            key={task.id}
            className="flex min-w-0 items-center gap-3 py-3 first:pt-0"
          >
            <Checkbox className="size-4 rounded border-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{task.title}</p>
            </div>
            <span
              className={`text-xs font-medium ${
                task.priority === "High"
                  ? "text-red-400"
                  : task.priority === "Medium"
                    ? "text-yellow-400"
                    : "text-green-400"
              } shrink-0`}
            >
              {task.priority}
            </span>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start px-0 text-sm font-normal text-primary hover:bg-transparent hover:text-primary/80"
        >
          <PlusIcon className="mr-1.5 size-3.5" />
          Add task
        </Button>
      </div>
    </section>
  );
};
