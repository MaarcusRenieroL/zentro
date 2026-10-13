import Link from "next/link";

import { Badge } from "@zentro/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";

import { EmptyTasks } from "./empty-tasks";
import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { FC } from "react";

const weeks = [
  ["May 25", "May 26", "May 27", "May 28", "May 29", "May 30", "May 31"],
  ["Jun 1", "Jun 2", "Jun 3", "Jun 4", "Jun 5", "Jun 6", "Jun 7"],
  ["Jun 8", "Jun 9", "Jun 10", "Jun 11", "Jun 12", "Jun 13", "Jun 14"],
  ["Jun 15", "Jun 16", "Jun 17", "Jun 18", "Jun 19", "Jun 20", "Jun 21"],
];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  tasks: WorkspaceTask[];
};

export const CalendarView: FC<Props> = ({ tasks }) => {
  if (!tasks.length) return <EmptyTasks />;

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">June 2026</CardTitle>
          <CardDescription>
            Tasks are grouped by due date for planning.
          </CardDescription>
        </div>

        <Badge variant="secondary">{tasks.length} scheduled</Badge>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="min-w-[980px] overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {weekdays.map((day) => (
              <div
                key={day}
                className="border-r px-3 py-2 text-xs font-medium text-muted-foreground last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weeks.flat().map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="min-h-36 border-r border-b bg-background p-2 last:border-r-0"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {day}
                  </span>
                </div>

                <div className="space-y-2">
                  {tasks
                    .filter((_, taskIndex) => taskIndex % 28 === index)
                    .map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.key}`}
                        className="block rounded-md border bg-muted/40 p-2 transition-colors hover:bg-muted"
                      >
                        <p className="line-clamp-2 text-xs font-medium">
                          {task.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {task.key}
                        </p>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
