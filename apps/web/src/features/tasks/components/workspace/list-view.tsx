"use client";

import { BlockedChip } from "./blocked-chip";
import Link from "next/link";
import { useMemo, useState, type FC, type ReactNode } from "react";
import {
  CheckIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";

import { StatusGlyph, PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { DueDate } from "~/src/components/due-date";
import { statusLabels } from "~/src/features/tasks/lib/constants";
import type {
  BulkChange,
  TaskStatus,
  WorkspaceTask,
} from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

import { CreateTaskModal } from "../create-task-modal";
import { BulkBar } from "./bulk-bar";
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
  onTasksChange?: (tasks: WorkspaceTask[], change: BulkChange) => void;
  onTasksDelete?: (tasks: WorkspaceTask[]) => void;
  onTaskCreated?: () => void | Promise<void>;
  /** Shown instead of the default empty state, e.g. when filters hide all. */
  empty?: ReactNode;
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

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <span className="relative flex size-4 shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer size-4 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-line-strong outline-none checked:border-ink checked:bg-ink focus-visible:ring-2 focus-visible:ring-ring"
      />
      <CheckIcon
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto size-3 text-ink-inverse opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}

function Assignee({ task, size }: { task: WorkspaceTask; size: number }) {
  return task.assignee !== "Unassigned" ? (
    <span title={task.assignee}>
      <ActorAvatar name={task.assignee} size={size} />
    </span>
  ) : (
    <span
      aria-label="Unassigned"
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full border-[1.5px] border-dashed border-line-strong"
    />
  );
}

export const ListView: FC<Props> = ({
  tasks,
  group = "state",
  sort = "due",
  onTasksChange,
  onTasksDelete,
  onTaskCreated,
  empty,
}) => {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sections = useMemo(
    () => buildSections(sortTasks(tasks, sort), group),
    [tasks, sort, group],
  );

  if (!tasks.length) return empty ?? <EmptyTasks />;

  const chosen = tasks.filter((task) => selected.has(task.id));
  const selectable = Boolean(onTasksChange || onTasksDelete);
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  return (
    <div className="flex flex-col gap-1.5" data-testid="task-list">
      {sections.map((section) => {
        const isClosed = closed[section.id] ?? section.collapsed;

        return (
          <section key={section.id} aria-label={section.label}>
            <h3 className="m-0 flex h-9 items-center rounded-md pr-1 hover:bg-hover sm:pr-2">
              <button
                type="button"
                aria-expanded={!isClosed}
                onClick={() =>
                  setClosed((current) => ({
                    ...current,
                    [section.id]: !isClosed,
                  }))
                }
                className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
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
                  <StatusGlyph status={section.status} size={12} decorative />
                ) : null}
                <span className="font-semibold">{section.label}</span>
                <span className="font-mono text-xs text-ink-3">
                  {section.rows.length}
                </span>
              </button>
              {section.status && onTaskCreated ? (
                <CreateTaskModal
                  defaultStatus={section.status}
                  onTaskCreated={onTaskCreated}
                  trigger={
                    <button
                      type="button"
                      aria-label={`Create a task in ${section.label}`}
                      className="hidden size-7 items-center justify-center rounded-sm text-ink-3 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring sm:flex"
                    >
                      <PlusIcon aria-hidden="true" className="size-4" />
                    </button>
                  }
                />
              ) : null}
            </h3>
            {isClosed ? null : (
              <ul>
                {section.rows.map((task) => {
                  const isSelected = selected.has(task.id);
                  const done = task.status === "done";

                  return (
                    <li
                      key={task.id}
                      className={cn(
                        "border-b border-hairline/70 sm:rounded-md sm:hover:bg-hover",
                        isSelected && "bg-selected sm:hover:bg-selected",
                      )}
                    >
                      <div className="hidden h-(--row-list) items-center gap-3 px-3 sm:flex">
                        {selectable ? (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggle(task.id)}
                            label={`Select ${task.key}`}
                          />
                        ) : null}
                        <StatusGlyph status={task.status} size={12} />
                        <span className="w-[58px] shrink-0 font-mono text-[13px] text-ink-3 [[data-density=compact]_&]:text-xs">
                          {task.key}
                        </span>
                        <Link
                          href={paths.task(task.key)}
                          className={cn(
                            "min-w-0 flex-1 truncate text-[length:var(--density-body)] outline-none focus-visible:underline",
                            done && "text-ink-3",
                          )}
                        >
                          {task.title}
                        </Link>
                        {done ? null : (
                          <BlockedChip blockedBy={task.blockedBy} />
                        )}
                        {task.subtaskCount && task.subtaskCount.total > 0 ? (
                          <span
                            title={`${task.subtaskCount.done} of ${task.subtaskCount.total} subtasks completed`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-hairline bg-surface-subtle px-1.5 py-px font-mono text-[11px] text-ink-2"
                          >
                            <CheckSquareIcon className="size-3 text-ink-3" />
                            <span>
                              {task.subtaskCount.done}/{task.subtaskCount.total}
                            </span>
                          </span>
                        ) : null}
                        <span
                          title={task.projectName}
                          className="hidden shrink-0 rounded-sm border border-hairline px-1.5 py-px font-mono text-[11px] text-ink-3 md:block [[data-density=compact]_&]:hidden"
                        >
                          {task.key.split("-")[0]}
                        </span>
                        <span className="flex w-[18px] shrink-0">
                          <PriorityMeter priority={task.priority} />
                        </span>
                        <span className="flex w-6 shrink-0 justify-center">
                          <Assignee task={task} size={24} />
                        </span>
                        <span className="flex w-[88px] shrink-0 justify-end">
                          <DueDate
                            value={task.dueAt}
                            done={done}
                            className="text-[13px]"
                          />
                        </span>
                      </div>
                      {/* Phones: two lines, the title gets the full width. */}
                      <div className="flex flex-col gap-1 px-2 py-2.5 sm:hidden">
                        <div className="flex items-center gap-2">
                          <StatusGlyph status={task.status} size={12} />
                          <span className="font-mono text-xs text-ink-3">
                            {task.key}
                          </span>
                          <span className="flex-1" />
                          <DueDate value={task.dueAt} done={done} />
                          <Assignee task={task} size={22} />
                        </div>
                        <Link
                          href={paths.task(task.key)}
                          className={cn(
                            "pl-5 text-[15px] leading-[22px] outline-none focus-visible:underline",
                            done && "text-ink-3",
                          )}
                        >
                          {task.title}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {chosen.length > 0 ? (
        <BulkBar
          selected={chosen}
          onChange={onTasksChange}
          onDelete={onTasksDelete}
          onClear={() => setSelected(new Set())}
        />
      ) : null}
    </div>
  );
};
