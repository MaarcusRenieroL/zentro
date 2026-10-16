"use client";

import { FC, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  FlameIcon,
  LayersIcon,
  Maximize2Icon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import { ActorAvatar } from "~/src/components/actor-avatar";
import type { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

type Props = {
  projectSlug: string;
  tasks: WorkspaceTask[];
};

type DependencyGraphData = {
  criticalPath: string[];
  bottlenecks: string[];
  nodes: Array<{
    key: string;
    stage: number;
    isCritical: boolean;
    isBottleneck: boolean;
  }>;
};

type TimelineScale = "days" | "weeks";

export const TimelineGanttVisualizer: FC<Props> = ({ projectSlug, tasks }) => {
  const trpc = useTrpcClient();
  const [scale, setScale] = useState<TimelineScale>("days");
  const [search, setSearch] = useState("");
  const [highlightCritical, setHighlightCritical] = useState(false);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [depData, setDepData] = useState<DependencyGraphData | null>(null);

  // Fetch dependency graph for critical path & bottlenecks
  useEffect(() => {
    let isMounted = true;
    trpc.project.getDependencyGraph
      .query({ slug: projectSlug })
      .then((res) => {
        if (isMounted) {
          setDepData(res as unknown as DependencyGraphData);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [projectSlug, trpc]);

  const criticalSet = useMemo(() => {
    return new Set(depData?.criticalPath ?? []);
  }, [depData]);

  // Establish base reference window around today
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const totalDays = scale === "days" ? 21 : 56;
  const daysBeforeToday = scale === "days" ? 5 : 14;

  const startDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBeforeToday + offsetWeeks * 7);
    return d;
  }, [today, daysBeforeToday, offsetWeeks]);

  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + totalDays);
    return d;
  }, [startDate, totalDays]);

  // Generate day/week column buckets
  const timeBuckets = useMemo(() => {
    const buckets: Array<{
      date: Date;
      label: string;
      subLabel: string;
      isToday: boolean;
    }> = [];
    const current = new Date(startDate);

    if (scale === "days") {
      for (let i = 0; i < totalDays; i++) {
        const isToday = current.getTime() === today.getTime();
        buckets.push({
          date: new Date(current),
          label: current.toLocaleDateString("en-US", { weekday: "narrow" }),
          subLabel: `${current.getDate()}`,
          isToday,
        });
        current.setDate(current.getDate() + 1);
      }
    } else {
      const numWeeks = Math.floor(totalDays / 7);
      for (let i = 0; i < numWeeks; i++) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const isCurrentWeek =
          today.getTime() >= current.getTime() &&
          today.getTime() <= weekEnd.getTime();

        buckets.push({
          date: new Date(current),
          label: current.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          subLabel: `W${i + 1}`,
          isToday: isCurrentWeek,
        });
        current.setDate(current.getDate() + 7);
      }
    }

    return buckets;
  }, [startDate, totalDays, scale, today]);

  // Map each task to a timeline position [startPercent, widthPercent]
  const timelineTasks = useMemo(() => {
    const totalMs = endDate.getTime() - startDate.getTime();

    return tasks.map((task, idx) => {
      let taskDue: Date;
      if (task.dueAt) {
        taskDue = new Date(task.dueAt);
        taskDue.setHours(0, 0, 0, 0);
      } else {
        taskDue = new Date(today);
        taskDue.setDate(taskDue.getDate() + 3 + (idx % 7));
      }

      // Estimate duration based on points or default
      const durationDays = Math.max(1, Math.min(10, task.estimatePoints ?? 2));
      const taskStart = new Date(taskDue);
      taskStart.setDate(taskStart.getDate() - durationDays);

      const startOffsetMs = taskStart.getTime() - startDate.getTime();
      const endOffsetMs = taskDue.getTime() - startDate.getTime();

      const startPercent = Math.max(
        0,
        Math.min(100, (startOffsetMs / totalMs) * 100),
      );
      const endPercent = Math.max(
        0,
        Math.min(100, (endOffsetMs / totalMs) * 100),
      );
      const widthPercent = Math.max(2.5, endPercent - startPercent);

      const isCritical = criticalSet.has(task.key);

      return {
        ...task,
        computedStart: taskStart,
        computedDue: taskDue,
        startPercent,
        widthPercent,
        isCritical,
      };
    });
  }, [tasks, startDate, endDate, today, criticalSet]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return timelineTasks.filter((t) => {
      if (highlightCritical && !t.isCritical) return false;
      if (!q) return true;
      return (
        t.key.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q)
      );
    });
  }, [timelineTasks, search, highlightCritical]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskKey) return null;
    return timelineTasks.find((t) => t.key === selectedTaskKey) ?? null;
  }, [timelineTasks, selectedTaskKey]);

  return (
    <div className="flex flex-col gap-4">
      {/* Visualizer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline/80 bg-surface/70 p-3.5 shadow-2xs backdrop-blur dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative h-8 w-56">
            <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timeline..."
              className="h-full w-full rounded-xl border border-hairline bg-surface pr-2.5 pl-8 text-xs text-ink outline-none placeholder:text-ink-3 focus-visible:border-ring"
            />
          </div>

          {/* Scale Toggle */}
          <div className="flex rounded-xl border border-hairline bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setScale("days")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                scale === "days"
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              Days
            </button>
            <button
              type="button"
              onClick={() => setScale("weeks")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                scale === "weeks"
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              Weeks
            </button>
          </div>

          {/* Highlight Critical Path Button */}
          <button
            type="button"
            onClick={() => setHighlightCritical((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              highlightCritical
                ? "border-warning bg-warning-subtle text-warning-text"
                : "border-hairline bg-surface text-ink-2 hover:text-ink",
            )}
          >
            <FlameIcon className="size-3.5" />
            <span>Critical Path ({criticalSet.size})</span>
          </button>
        </div>

        {/* Navigation & Jump to Today */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOffsetWeeks((w) => w - 1)}
            className="flex size-7 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-2 hover:text-ink transition-colors cursor-pointer"
            title="Previous period"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOffsetWeeks(0)}
            className="rounded-lg border border-hairline bg-surface px-2.5 py-1 font-mono text-[11px] font-medium text-ink hover:bg-hover transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setOffsetWeeks((w) => w + 1)}
            className="flex size-7 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-2 hover:text-ink transition-colors cursor-pointer"
            title="Next period"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="overflow-x-auto rounded-2xl border border-hairline/80 bg-surface/50 shadow-2xs">
        <div className="min-w-[960px]">
          {/* Header Row: Task metadata label on left, timeline buckets on right */}
          <div className="grid grid-cols-[280px_minmax(0,1fr)] border-b border-hairline/80 bg-surface/90">
            <div className="flex items-center justify-between px-4 py-2.5 border-r border-hairline text-xs font-semibold text-ink">
              <span>Task & Milestone</span>
              <span className="font-mono text-[10px] text-ink-3">
                {filteredTasks.length}{" "}
                {filteredTasks.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Timeline Column Headers */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${timeBuckets.length}, minmax(0, 1fr))`,
              }}
            >
              {timeBuckets.map((bucket, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center justify-center py-1.5 border-r border-hairline/40 text-center transition-colors",
                    bucket.isToday &&
                      "bg-signal-subtle/50 font-semibold text-signal",
                  )}
                >
                  <span className="text-[10px] uppercase text-ink-3 leading-tight">
                    {bucket.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[11px] leading-tight",
                      bucket.isToday ? "text-signal font-bold" : "text-ink",
                    )}
                  >
                    {bucket.subLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-hairline/50">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-3">
                No tasks match the active timeline filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = selectedTaskKey === task.key;

                return (
                  <div
                    key={task.id}
                    onClick={() =>
                      setSelectedTaskKey(isSelected ? null : task.key)
                    }
                    className={cn(
                      "group grid grid-cols-[280px_minmax(0,1fr)] items-center transition-colors hover:bg-hover/50 cursor-pointer",
                      isSelected && "bg-hover/80",
                    )}
                  >
                    {/* Left Task Identity Column */}
                    <div className="flex items-center gap-2.5 px-4 py-2.5 border-r border-hairline min-w-0">
                      <StatusGlyph status={task.status} size={14} decorative />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-ink-2">
                            {task.key}
                          </span>
                          {task.isCritical && (
                            <span className="flex items-center gap-0.5 rounded px-1 py-0.2 bg-warning-subtle text-[9px] font-mono font-medium text-warning-text">
                              <FlameIcon className="size-2.5" />
                              Crit
                            </span>
                          )}
                        </div>
                        <span className="truncate text-xs font-medium text-ink">
                          {task.title}
                        </span>
                      </div>
                      <ActorAvatar name={task.assignee} size={18} />
                    </div>

                    {/* Right Gantt Bar Track */}
                    <div className="relative h-10 w-full overflow-hidden px-1">
                      {/* Grid Column Guidelines */}
                      <div
                        className="absolute inset-0 grid pointer-events-none"
                        style={{
                          gridTemplateColumns: `repeat(${timeBuckets.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {timeBuckets.map((bucket, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "border-r border-hairline/30 h-full",
                              bucket.isToday &&
                                "bg-signal-subtle/20 border-signal/30",
                            )}
                          />
                        ))}
                      </div>

                      {/* Interactive Gantt Bar */}
                      <div
                        style={{
                          left: `${task.startPercent}%`,
                          width: `${task.widthPercent}%`,
                        }}
                        className={cn(
                          "absolute top-2 h-6 rounded-lg px-2 flex items-center justify-between text-[11px] font-medium shadow-xs transition-all cursor-pointer select-none",
                          task.status === "done"
                            ? "bg-status-done text-ink-inverse"
                            : task.isCritical
                              ? "bg-warning-subtle border border-warning text-warning-text font-semibold shadow-xs"
                              : task.status === "in-progress"
                                ? "bg-signal text-on-signal"
                                : "bg-surface border border-hairline text-ink hover:border-hairline-strong",
                        )}
                        title={`${task.key}: ${task.title} (${task.computedStart.toLocaleDateString()} - ${task.computedDue.toLocaleDateString()})`}
                      >
                        <span className="truncate pr-1 text-[10px]">
                          {task.key}
                        </span>
                        {task.estimatePoints ? (
                          <span className="font-mono text-[9px] opacity-80 shrink-0">
                            {task.estimatePoints}p
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Selected Task Detail Drawer Bar */}
      {selectedTask && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <StatusGlyph status={selectedTask.status} size={16} decorative />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-ink-2">
                  {selectedTask.key}
                </span>
                <span className="text-xs text-ink-3">·</span>
                <span className="text-xs text-ink-3">
                  Assignee: {selectedTask.assignee}
                </span>
              </div>
              <span className="text-sm font-semibold text-ink">
                {selectedTask.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs text-ink-3">
              <CalendarIcon className="size-3.5" />
              <span>
                {selectedTask.computedStart.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {selectedTask.computedDue.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <Link
              href={paths.task(selectedTask.key)}
              className="rounded-xl bg-ink px-3 py-1.5 text-xs font-medium text-ink-inverse hover:opacity-90 transition-opacity"
            >
              Open Task
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
