"use client";

import { useState, type FC } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";

import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const perCell = 2;

type Props = {
  tasks: WorkspaceTask[];
};

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Whole weeks, starting on Monday.
function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const weeks = Math.ceil(
    (offset + new Date(year, month + 1, 0).getDate()) / 7,
  );

  return Array.from(
    { length: weeks * 7 },
    (_, index) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
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
    if (!task.dueAt) continue;

    const key = toDayKey(new Date(task.dueAt));

    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task]);
  }

  const unscheduled = tasks.filter((task) => !task.dueAt).length;
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const shift = (delta: number) =>
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);

      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <section
      aria-label="Calendar"
      className="tile overflow-hidden"
      data-testid="task-calendar"
    >
      <header className="flex items-center gap-3 px-[18px] py-3.5">
        <h2 className="text-xl font-semibold tracking-[-0.01em]">
          {monthLabel}
        </h2>
        {unscheduled > 0 ? (
          <span className="font-mono text-xs text-ink-3">
            {unscheduled} without a due date
          </span>
        ) : null}
        <span className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();

            setCursor({ year: today.getFullYear(), month: today.getMonth() });
          }}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => shift(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => shift(1)}
        >
          <ChevronRightIcon />
        </Button>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-y border-hairline">
            {weekdays.map((day) => (
              <div
                key={day}
                className="px-3 py-2.5 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const key = toDayKey(day);
              const dayTasks = tasksByDay.get(key) ?? [];
              const inMonth = day.getMonth() === cursor.month;
              const isToday = key === todayKey;
              const weekend = index % 7 >= 5;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-[124px] flex-col gap-1 border-r border-b border-hairline/70 p-2 [&:nth-child(7n)]:border-r-0",
                    weekend && "bg-sunken/50",
                    !inMonth && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center self-start rounded-full font-mono text-xs",
                      isToday ? "bg-ink text-ink-inverse" : "text-ink-2",
                    )}
                    aria-label={isToday ? `${day.getDate()}, today` : undefined}
                  >
                    {day.getDate()}
                  </span>
                  {dayTasks.slice(0, perCell).map((task) => (
                    <Link
                      key={task.id}
                      href={paths.task(task.key)}
                      title={`${task.key} ${task.title}`}
                      className={cn(
                        "flex h-[22px] items-center gap-1.5 rounded-md border border-hairline bg-surface px-1.5 text-xs outline-none hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring",
                        task.status === "done" && "text-ink-3",
                      )}
                    >
                      <StatusGlyph status={task.status} size={11} decorative />
                      <span className="shrink-0 font-mono text-[10px] text-ink-3">
                        {task.key}
                      </span>
                      <span className="min-w-0 truncate">{task.title}</span>
                    </Link>
                  ))}
                  {dayTasks.length > perCell ? (
                    <span className="px-1 font-mono text-[11px] text-ink-3">
                      +{dayTasks.length - perCell} more
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
