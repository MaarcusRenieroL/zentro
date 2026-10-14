import { FC } from "react";
import Link from "next/link";

import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";

import type { DashboardTaskItem } from "~/src/lib/dashboard-data";

type Props = {
  tasks: DashboardTaskItem[];
  tasksHref: string;
};

export const TasksSection: FC<Props> = ({ tasks, tasksHref }) => {
  return (
    <section className="rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-hairline/60">
      <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-2">
        <h2 className="font-display text-xl text-ink">My tasks</h2>
        <Link
          href={tasksHref}
          className="rounded-full px-3 py-1 text-sm font-medium text-signal hover:bg-signal-subtle"
        >
          View all
        </Link>
      </div>
      {tasks.length ? (
        <div className="flex flex-col">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={task.href}
              className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-sunken"
            >
              <StatusGlyph status={task.status} size={16} />
              <p className="min-w-0 flex-1 truncate text-sm text-ink">
                {task.title}
              </p>
              <PriorityGlyph priority={task.priority} size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="m-1 rounded-2xl bg-sunken px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink">No tasks assigned</p>
          <p className="mt-1 text-xs text-ink-2">
            Tasks assigned to you will appear here.
          </p>
          <Link
            href={tasksHref}
            className="mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium text-signal hover:bg-signal-subtle"
          >
            Open tasks
          </Link>
        </div>
      )}
    </section>
  );
};
