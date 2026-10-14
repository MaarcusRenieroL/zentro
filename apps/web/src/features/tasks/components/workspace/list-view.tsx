"use client";

import Link from "next/link";
import { useState, type FC } from "react";
import { ChevronRightIcon } from "lucide-react";

import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { Tile } from "@zentro/ui/components/tile";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { initialsOf } from "@zentro/ui/lib/tone";
import { cn } from "@zentro/ui/lib/utils";

import { statusLabels } from "~/src/features/tasks/lib/constants";
import type { TaskStatus, WorkspaceTask } from "~/src/features/tasks/lib/types";
import { DueDate } from "~/src/components/due-date";
import { paths } from "~/src/lib/paths";

import { EmptyTasks } from "./empty-tasks";

// What is moving comes first; finished and parked work folds away.
const groups: Array<{ status: TaskStatus; collapsed: boolean }> = [
  { status: "in-progress", collapsed: false },
  { status: "review", collapsed: false },
  { status: "todo", collapsed: false },
  { status: "backlog", collapsed: true },
  { status: "done", collapsed: true },
];

type Props = {
  tasks: WorkspaceTask[];
};

export const ListView: FC<Props> = ({ tasks }) => {
  const [closed, setClosed] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((group) => [group.status, group.collapsed])),
  );

  if (!tasks.length) return <EmptyTasks />;

  return (
    <Tile flush data-testid="task-list">
      {groups.map(({ status }) => {
        const rows = tasks.filter((task) => task.status === status);

        if (!rows.length) return null;

        const isClosed = closed[status];

        return (
          <section
            key={status}
            aria-label={statusLabels[status]}
            className="border-b border-hairline last:border-b-0"
          >
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={!isClosed}
                onClick={() =>
                  setClosed((current) => ({
                    ...current,
                    [status]: !current[status],
                  }))
                }
                className="flex h-(--row-h) w-full items-center gap-3 bg-sunken/60 px-(--pad-tile) text-left text-sm font-medium text-ink outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <ChevronRightIcon
                  aria-hidden="true"
                  className={cn(
                    "size-4 text-ink-3 transition-transform duration-(--duration-fast)",
                    !isClosed && "rotate-90",
                  )}
                />
                <StatusGlyph status={status} size={16} decorative />
                {statusLabels[status]}
                <span className="font-mono text-xs text-ink-3">
                  {rows.length}
                </span>
              </button>
            </h3>
            {isClosed ? null : (
              <ul>
                {rows.map((task) => {
                  const assigned = task.assignee !== "Unassigned";

                  return (
                    <li key={task.id}>
                      <Link
                        href={paths.task(task.key)}
                        className="flex h-(--row-h) items-center gap-3 px-(--pad-tile) outline-none transition-colors duration-(--duration-fast) hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <StatusGlyph status={task.status} size={16} />
                        <TaskKey className="w-16">{task.key}</TaskKey>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm text-ink",
                            task.status === "done" && "text-ink-3",
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="hidden w-36 truncate text-xs text-ink-3 md:block">
                          {task.projectName}
                        </span>
                        <PriorityGlyph priority={task.priority} size={16} />
                        <span className="hidden w-24 text-right sm:block">
                          <DueDate
                            value={task.dueAt}
                            done={task.status === "done"}
                          />
                        </span>
                        <span className="flex w-6 justify-end">
                          {assigned ? (
                            <Avatar size="sm" title={task.assignee}>
                              <AvatarFallback seed={task.assignee}>
                                {initialsOf(task.assignee)}
                              </AvatarFallback>
                            </Avatar>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </Tile>
  );
};
