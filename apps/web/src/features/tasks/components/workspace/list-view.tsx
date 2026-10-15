"use client";

import Link from "next/link";
import { useMemo, useState, type FC } from "react";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "lucide-react";

import { StatusGlyph, PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { DueDate } from "~/src/components/due-date";
import { statusLabels } from "~/src/features/tasks/lib/constants";
import type { TaskStatus, WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

import { EmptyTasks } from "./empty-tasks";
import type { TaskGroup, TaskSort } from "./task-workspace-header";

// What is moving comes first; finished and parked work folds away.
const stateOrder: Array<{ status: TaskStatus; collapsed: boolean }> = [
  { status: "in-progress", collapsed: false },
  { status: "review", collapsed: false },
  { status: "todo", collapsed: false },
  { status: "backlog", collapsed: true },
  { status: "done", collapsed: true },
];

const priorityRank = { high: 0, medium: 1, low: 2 } as const;

type Props = {
  tasks: WorkspaceTask[];
  group?: TaskGroup;
  sort?: TaskSort;
  onTasksStatusChange?: (tasks: WorkspaceTask[], status: TaskStatus) => void;
};

function sortTasks(tasks: WorkspaceTask[], sort: TaskSort) {
  const copy = [...tasks];

  copy.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "priority") {
      return (
        priorityRank[a.priority] - priorityRank[b.priority] ||
        a.title.localeCompare(b.title)
      );
    }
    if (sort === "key") {
      return b.key.localeCompare(a.key, undefined, { numeric: true });
    }

    // Due date: soonest first, undated last.
    const left = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const right = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;

    return left - right || a.title.localeCompare(b.title);
  });

  return copy;
}

type Section = {
  id: string;
  label: string;
  status?: TaskStatus;
  collapsed: boolean;
  rows: WorkspaceTask[];
};

function buildSections(tasks: WorkspaceTask[], group: TaskGroup): Section[] {
  if (group === "none") {
    return [{ id: "all", label: "All tasks", collapsed: false, rows: tasks }];
  }

  if (group === "state") {
    return stateOrder
      .map(({ status, collapsed }) => ({
        id: status,
        label: statusLabels[status],
        status,
        collapsed,
        rows: tasks.filter((task) => task.status === status),
      }))
      .filter((section) => section.rows.length);
  }

  const keyOf = (task: WorkspaceTask) =>
    group === "priority"
      ? task.priority
      : group === "project"
        ? task.projectName
        : task.assignee;
  const labelOf = (value: string) =>
    group === "priority"
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value;
  const buckets = new Map<string, WorkspaceTask[]>();

  for (const task of tasks) {
    const key = keyOf(task);

    buckets.set(key, [...(buckets.get(key) ?? []), task]);
  }

  return Array.from(buckets, ([key, rows]) => ({
    id: key,
    label: labelOf(key),
    collapsed: false,
    rows,
  })).sort((a, b) =>
    group === "priority"
      ? priorityRank[a.id as keyof typeof priorityRank] -
        priorityRank[b.id as keyof typeof priorityRank]
      : a.label.localeCompare(b.label),
  );
}

export const ListView: FC<Props> = ({
  tasks,
  group = "state",
  sort = "due",
  onTasksStatusChange,
}) => {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sections = useMemo(
    () => buildSections(sortTasks(tasks, sort), group),
    [tasks, sort, group],
  );

  if (!tasks.length) return <EmptyTasks />;

  const chosen = tasks.filter((task) => selected.has(task.id));
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  return (
    <div className="flex flex-col gap-1.5" data-testid="task-list">
      {chosen.length > 0 ? (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="sticky top-14 z-(--z-sticky) flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-2 shadow-sm"
        >
          <span className="text-sm font-medium">{chosen.length} selected</span>
          <Select
            onValueChange={(status) => {
              onTasksStatusChange?.(chosen, status as TaskStatus);
              setSelected(new Set());
            }}
          >
            <SelectTrigger
              aria-label="Move selected to"
              className="h-8 rounded-xl border-hairline bg-transparent text-[13px] shadow-none data-[size=default]:h-8"
            >
              <SelectValue placeholder="Move to…" />
            </SelectTrigger>
            <SelectContent>
              {stateOrder.map(({ status }) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      {sections.map((section) => {
        const isClosed = closed[section.id] ?? section.collapsed;

        return (
          <section key={section.id} aria-label={section.label}>
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={!isClosed}
                onClick={() =>
                  setClosed((current) => ({
                    ...current,
                    [section.id]: !isClosed,
                  }))
                }
                className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isClosed ? (
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-3.5 text-ink-3"
                  />
                ) : (
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-3.5 text-ink-3"
                  />
                )}
                {section.status ? (
                  <StatusGlyph status={section.status} size={14} decorative />
                ) : null}
                <span className="font-semibold">{section.label}</span>
                <span className="font-mono text-xs text-ink-3">
                  {section.rows.length}
                </span>
                <span className="flex-1" />
                <PlusIcon aria-hidden="true" className="size-3.5 text-ink-3" />
              </button>
            </h3>
            {isClosed ? null : (
              <ul>
                {section.rows.map((task) => {
                  const assigned = task.assignee !== "Unassigned";
                  const isSelected = selected.has(task.id);

                  return (
                    <li
                      key={task.id}
                      className={cn(
                        "group/row flex h-(--row-list) items-center gap-3 rounded-xl border-t border-hairline/60 px-3 first:border-t-0 hover:bg-hover",
                        isSelected && "bg-signal-subtle",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(task.id)}
                        aria-label={`Select ${task.key}`}
                        className={cn(
                          "size-4 shrink-0 cursor-pointer rounded-[5px] border-[1.5px] border-ink-3 accent-[var(--ink)] opacity-0 outline-none group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected && "opacity-100",
                        )}
                      />
                      <StatusGlyph status={task.status} size={14} />
                      <span className="w-16 shrink-0 font-mono text-xs text-ink-3">
                        {task.key}
                      </span>
                      <Link
                        href={paths.task(task.key)}
                        className={cn(
                          "min-w-0 flex-1 truncate text-[length:var(--density-body)] outline-none after:absolute focus-visible:underline",
                          task.status === "done" && "text-ink-3",
                        )}
                      >
                        {task.title}
                      </Link>
                      <span
                        title={task.projectName}
                        className="hidden shrink-0 rounded-xs border border-hairline px-1.5 font-mono text-[11px] text-ink-2 md:block"
                      >
                        {task.key.split("-")[0]}
                      </span>
                      <PriorityMeter priority={task.priority} />
                      <span className="flex w-6 shrink-0 justify-center">
                        {assigned ? (
                          <span title={task.assignee}>
                            <ActorAvatar name={task.assignee} size={24} />
                          </span>
                        ) : (
                          <span
                            aria-label="Unassigned"
                            className="size-6 rounded-full border border-dashed border-line-strong"
                          />
                        )}
                      </span>
                      <span className="hidden w-[88px] shrink-0 justify-end sm:flex">
                        <DueDate
                          value={task.dueAt}
                          done={task.status === "done"}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};
