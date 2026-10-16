"use client";

import { BlockedChip } from "./blocked-chip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import {
  CheckIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  KeyboardIcon,
  PlusIcon,
} from "lucide-react";

import { Kbd } from "@zentro/ui/components/kbd";
import { StatusGlyph, PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { DueDate } from "~/src/components/due-date";
import { ShortcutsDialog } from "~/src/components/shortcuts-dialog";
import { statusLabels } from "~/src/features/tasks/lib/constants";
import type {
  BulkChange,
  TaskPriority,
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
  const router = useRouter();
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const focusedRowRef = useRef<HTMLLIElement | null>(null);

  const sections = useMemo(
    () => buildSections(sortTasks(tasks, sort), group),
    [tasks, sort, group],
  );

  const visibleTasks = useMemo(() => {
    return sections.flatMap((section) => {
      const isClosed = closed[section.id] ?? section.collapsed;
      return isClosed ? [] : section.rows;
    });
  }, [sections, closed]);

  const chosen = tasks.filter((task) => selected.has(task.id));
  const selectable = Boolean(onTasksChange || onTasksDelete);
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  useEffect(() => {
    if (focusedIndex !== null && focusedRowRef.current) {
      focusedRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("[role='dialog']") ||
          target.closest("[role='menu']"))
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev === null ? 0 : Math.min(visibleTasks.length - 1, prev + 1),
        );
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev === null ? visibleTasks.length - 1 : Math.max(0, prev - 1),
        );
      } else if (e.key === "x") {
        e.preventDefault();
        if (focusedIndex !== null && visibleTasks[focusedIndex]) {
          toggle(visibleTasks[focusedIndex].id);
        }
      } else if (e.key === "A" && e.shiftKey) {
        e.preventDefault();
        setSelected(new Set(visibleTasks.map((t) => t.id)));
      } else if (e.key === "Escape") {
        if (selected.size > 0) {
          setSelected(new Set());
        } else {
          setFocusedIndex(null);
        }
      } else if (e.key === "Enter" || e.key === "o") {
        if (focusedIndex !== null && visibleTasks[focusedIndex]) {
          router.push(paths.task(visibleTasks[focusedIndex].key));
        }
      } else if (e.key === "s" || e.key === "S") {
        const targets =
          chosen.length > 0
            ? chosen
            : focusedIndex !== null && visibleTasks[focusedIndex]
              ? [visibleTasks[focusedIndex]]
              : [];
        if (targets.length > 0 && onTasksChange) {
          e.preventDefault();
          const statusCycle: TaskStatus[] = [
            "todo",
            "in-progress",
            "review",
            "done",
            "backlog",
          ];
          const curr = targets[0]?.status ?? "todo";
          const next =
            statusCycle[(statusCycle.indexOf(curr) + 1) % statusCycle.length] ??
            "todo";
          onTasksChange(targets, { status: next });
        }
      } else if (e.key === "p" || e.key === "P") {
        const targets =
          chosen.length > 0
            ? chosen
            : focusedIndex !== null && visibleTasks[focusedIndex]
              ? [visibleTasks[focusedIndex]]
              : [];
        if (targets.length > 0 && onTasksChange) {
          e.preventDefault();
          const prioCycle: TaskPriority[] = ["low", "medium", "high"];
          const curr = targets[0]?.priority ?? "medium";
          const next =
            prioCycle[(prioCycle.indexOf(curr) + 1) % prioCycle.length] ??
            "medium";
          onTasksChange(targets, { priority: next });
        }
      } else if (e.key === "e" || e.key === "E") {
        const targets =
          chosen.length > 0
            ? chosen
            : focusedIndex !== null && visibleTasks[focusedIndex]
              ? [visibleTasks[focusedIndex]]
              : [];
        if (targets.length > 0 && onTasksChange) {
          e.preventDefault();
          const pointsCycle = [null, 1, 2, 3, 5, 8];
          const curr = targets[0]?.estimatePoints ?? null;
          const currIdx = pointsCycle.indexOf(curr);
          const next = pointsCycle[(currIdx + 1) % pointsCycle.length] ?? null;
          onTasksChange(targets, { estimatePoints: next });
        }
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setCreateModalOpen(true);
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    visibleTasks,
    focusedIndex,
    chosen,
    onTasksChange,
    router,
    selected.size,
  ]);

  if (!tasks.length) return empty ?? <EmptyTasks />;

  return (
    <div className="flex flex-col gap-1.5" data-testid="task-list">
      {sections.map((section) => {
        const isClosed = closed[section.id] ?? section.collapsed;

        return (
          <section key={section.id} aria-label={section.label} className="mb-4">
            <h3 className="m-0 flex h-9 items-center rounded-lg bg-surface/50 border border-hairline/60 pr-1 hover:bg-hover/80 transition-colors mb-1 sm:pr-2">
              <button
                type="button"
                aria-expanded={!isClosed}
                onClick={() =>
                  setClosed((current) => ({
                    ...current,
                    [section.id]: !isClosed,
                  }))
                }
                className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-left text-xs font-semibold uppercase tracking-wider text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
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
                  const isFocused =
                    focusedIndex !== null &&
                    visibleTasks[focusedIndex]?.id === task.id;
                  const done = task.status === "done";

                  return (
                    <li
                      key={task.id}
                      ref={
                        isFocused
                          ? (el) => {
                              focusedRowRef.current = el;
                            }
                          : undefined
                      }
                      className={cn(
                        "group relative border-b border-hairline/70 transition-colors sm:rounded-md sm:hover:bg-hover",
                        isFocused &&
                          "bg-signal-subtle/40 ring-1 ring-signal/50 shadow-xs",
                        isSelected && "bg-selected sm:hover:bg-selected",
                      )}
                    >
                      {isFocused ? (
                        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-signal" />
                      ) : null}
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
                        {task.estimatePoints ? (
                          <span
                            title={`Estimate: ${task.estimatePoints} story points`}
                            className="hidden shrink-0 rounded-sm border border-hairline bg-surface-subtle px-1.5 py-px font-mono text-[11px] text-ink-3 sm:inline-flex"
                          >
                            {task.estimatePoints}pts
                          </span>
                        ) : null}
                        {task.timeSpentMinutes && task.timeSpentMinutes > 0 ? (
                          <span
                            title={`Time logged: ${task.timeSpentMinutes}m`}
                            className="hidden shrink-0 items-center gap-1 rounded-sm border border-hairline bg-surface-subtle px-1.5 py-px font-mono text-[11px] text-ink-3 sm:inline-flex"
                          >
                            <ClockIcon className="size-3 text-ink-3" />
                            {task.timeSpentMinutes >= 60
                              ? `${Math.floor(task.timeSpentMinutes / 60)}h`
                              : `${task.timeSpentMinutes}m`}
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
                        {task.status === "backlog" && onTasksChange ? (
                          <button
                            type="button"
                            title="Plan into Active Sprint"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onTasksChange([task], { status: "todo" });
                            }}
                            className="hidden group-hover:inline-flex items-center gap-1 rounded border border-signal/30 bg-signal-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-signal hover:bg-signal/20 transition-colors shrink-0 cursor-pointer"
                          >
                            <span>+ Sprint</span>
                          </button>
                        ) : null}
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

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-1 px-2 text-xs text-ink-3 border-t border-hairline/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Kbd className="text-[10px]">J</Kbd>
            <Kbd className="text-[10px]">K</Kbd> navigate
          </span>
          <span className="text-hairline hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Kbd className="text-[10px]">X</Kbd> select
          </span>
          <span className="text-hairline hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Kbd className="text-[10px]">S</Kbd> status
          </span>
          <span className="text-hairline hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Kbd className="text-[10px]">P</Kbd> priority
          </span>
          <span className="text-hairline hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Kbd className="text-[10px]">E</Kbd> points
          </span>
          <span className="text-hairline hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Kbd className="text-[10px]">C</Kbd> new
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink cursor-pointer transition-colors"
        >
          <KeyboardIcon className="size-3.5" />
          <span>Shortcuts</span>
          <Kbd className="text-[10px]">?</Kbd>
        </button>
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onTaskCreated={onTaskCreated}
        hideTrigger
      />
    </div>
  );
};
