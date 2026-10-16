"use client";

import { FC } from "react";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  LayersIcon,
  SparklesIcon,
  ZapIcon,
  ArrowRightIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

export type SprintScope = "all" | "sprint" | "backlog";

export type SprintStats = {
  totalTasks: number;
  doneTasks: number;
  sprintTasks: number;
  sprintDoneTasks: number;
  backlogTasks: number;
  totalPoints: number;
  donePoints: number;
};

type Props = {
  scope: SprintScope;
  onScopeChange: (scope: SprintScope) => void;
  stats: SprintStats;
  onPlanAllToSprint?: () => void;
};

export const SprintCycleBar: FC<Props> = ({
  scope,
  onScopeChange,
  stats,
  onPlanAllToSprint,
}) => {
  const percent =
    stats.sprintTasks > 0
      ? Math.round((stats.sprintDoneTasks / stats.sprintTasks) * 100)
      : 0;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-hairline/80 bg-surface/80 p-3.5 shadow-2xs backdrop-blur-xs">
      {/* Top Row: Sprint Info, Scope Toggle & Velocity */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Cycle Info */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <ZapIcon className="size-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-ink tracking-tight">
              Sprint 24
            </span>
            <span className="rounded-md border border-signal/20 bg-signal-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-signal">
              ACTIVE CYCLE
            </span>
            <span className="hidden items-center gap-1 rounded-md border border-hairline bg-surface-subtle px-2 py-0.5 font-mono text-[11px] text-ink-3 sm:inline-flex">
              <CalendarDaysIcon className="size-3 text-ink-3" />5 days left
            </span>
          </div>
        </div>

        {/* Right: Scope Segmented Control */}
        <div
          role="radiogroup"
          aria-label="Sprint Scope"
          className="flex gap-1 rounded-xl border border-hairline bg-surface p-1 shadow-2xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={scope === "sprint"}
            onClick={() => onScopeChange("sprint")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              scope === "sprint"
                ? "bg-ink text-ink-inverse shadow-xs"
                : "text-ink-2 hover:text-ink hover:bg-hover",
            )}
          >
            <ZapIcon className="size-3" />
            <span>Active Sprint</span>
            <span
              className={cn(
                "font-mono text-[10px] rounded px-1",
                scope === "sprint"
                  ? "bg-ink-inverse/20 text-ink-inverse"
                  : "bg-sunken text-ink-3",
              )}
            >
              {stats.sprintTasks}
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={scope === "backlog"}
            onClick={() => onScopeChange("backlog")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              scope === "backlog"
                ? "bg-ink text-ink-inverse shadow-xs"
                : "text-ink-2 hover:text-ink hover:bg-hover",
            )}
          >
            <LayersIcon className="size-3" />
            <span>Backlog</span>
            <span
              className={cn(
                "font-mono text-[10px] rounded px-1",
                scope === "backlog"
                  ? "bg-ink-inverse/20 text-ink-inverse"
                  : "bg-sunken text-ink-3",
              )}
            >
              {stats.backlogTasks}
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={scope === "all"}
            onClick={() => onScopeChange("all")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              scope === "all"
                ? "bg-ink text-ink-inverse shadow-xs"
                : "text-ink-2 hover:text-ink hover:bg-hover",
            )}
          >
            <span>All Work</span>
            <span
              className={cn(
                "font-mono text-[10px] rounded px-1",
                scope === "all"
                  ? "bg-ink-inverse/20 text-ink-inverse"
                  : "bg-sunken text-ink-3",
              )}
            >
              {stats.totalTasks}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Cycle Progress Bar & Points Burndown */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-ink-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-ink font-medium">
              {stats.sprintDoneTasks} of {stats.sprintTasks} tasks finished
            </span>
            {stats.totalPoints > 0 ? (
              <span className="font-mono text-ink-3">
                ({stats.donePoints}/{stats.totalPoints} story pts)
              </span>
            ) : null}
          </div>
          <span className="font-mono font-semibold text-ink">
            {percent}% completed
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              percent === 100 ? "bg-success" : "bg-signal",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Scope Context Banners */}
      {scope === "backlog" ? (
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-subtle/70 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-ink-2">
            <LayersIcon className="size-3.5 text-signal" />
            <span>
              <strong>Backlog Queue:</strong> Unscheduled work awaiting cycle
              commitment.
            </span>
          </div>
          {onPlanAllToSprint && stats.backlogTasks > 0 ? (
            <button
              type="button"
              onClick={onPlanAllToSprint}
              className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] font-semibold text-ink hover:bg-hover transition-colors cursor-pointer"
            >
              <span>Plan All into Sprint</span>
              <ArrowRightIcon className="size-3 text-signal" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
