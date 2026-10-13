"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";

import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";
import { FC } from "react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  tasks: WorkspaceTask[];
};

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// The grid always shows whole weeks, starting on Sunday.
function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const weeks = Math.ceil(
    (first.getDay() + new Date(year, month + 1, 0).getDate()) / 7,
  );

  return Array.from({ length: weeks * 7 }, (_, index) => {
    return new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
  });
}

export const CalendarView: FC<Props> = ({ tasks }) => {
  // Opens on the current month.
  const [cursor, setCursor] = useState(() => {
    const today = new Date();

    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const days = getMonthDays(cursor.year, cursor.month);
  const todayKey = toDayKey(new Date());
  const tasksByDay = new Map<string, WorkspaceTask[]>();

  for (const task of tasks) {
    if (!task.dueAt) {
      continue;
    }

    const key = toDayKey(new Date(task.dueAt));

    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task]);
  }

  const scheduledInMonth = tasks.filter((task) => {
    if (!task.dueAt) {
      return false;
    }

    const due = new Date(task.dueAt);

    return due.getFullYear() === cursor.year && due.getMonth() === cursor.month;
  }).length;
  const unscheduled = tasks.filter((task) => !task.dueAt).length;

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  const shiftMonth = (delta: number) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);

    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{monthLabel}</CardTitle>
          <CardDescription>
            Tasks are placed on their due date.
            {unscheduled
              ? ` ${unscheduled} without a due date are not shown.`
              : ""}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{scheduledInMonth} scheduled</Badge>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
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
            {days.map((day) => {
              const key = toDayKey(day);
              const inMonth = day.getMonth() === cursor.month;

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-36 border-r border-b bg-background p-2 last:border-r-0",
                    !inMonth && "bg-muted/20",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-medium text-muted-foreground",
                        key === todayKey && "text-primary",
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(tasksByDay.get(key) ?? []).map((task) => (
                      <Link
                        key={task.id}
                        href={paths.task(task.key)}
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
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
