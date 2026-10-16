"use client";

import Link from "next/link";
import { CheckSquareIcon, ClockIcon } from "lucide-react";
import { FC } from "react";

import { PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { DueDate } from "~/src/components/due-date";
import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";
import { BlockedChip } from "./blocked-chip";

type Props = {
  task: WorkspaceTask;
};

export const TaskCard: FC<Props> = ({ task }) => {
  const assigned = task.assignee !== "Unassigned";
  const done = task.status === "done";

  return (
    <Link
      href={paths.task(task.key)}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-3.5 shadow-2xs transition-all hover:border-signal/40 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring outline-none",
        done && "opacity-65 bg-surface/60",
      )}
    >
      {/* Top Header: Task Key + Blocked Chip + Assignee */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold text-ink-3 transition-colors group-hover:text-signal">
          {task.key}
        </span>
        {done ? null : <BlockedChip blockedBy={task.blockedBy} />}
        <span className="flex-1" />
        {assigned ? (
          <span
            title={task.assignee}
            className="transition-transform group-hover:scale-105"
          >
            <ActorAvatar name={task.assignee} size={22} />
          </span>
        ) : (
          <span
            aria-label="Unassigned"
            className="size-[22px] rounded-full border border-dashed border-hairline bg-muted/20"
          />
        )}
      </div>

      {/* Task Title */}
      <p
        className={cn(
          "line-clamp-2 text-[13px] leading-snug font-medium text-ink transition-colors group-hover:text-ink",
          done && "line-through text-ink-3",
        )}
      >
        {task.title}
      </p>

      {/* Footer: Priority + Estimates + Time Logged + Subtasks + DueDate */}
      <div className="mt-1 flex items-center gap-2 pt-1 border-t border-hairline/60 text-xs text-ink-2">
        <PriorityMeter priority={task.priority} />

        {task.estimatePoints ? (
          <span
            title={`Estimate: ${task.estimatePoints} story points`}
            className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-2"
          >
            {task.estimatePoints} pts
          </span>
        ) : null}

        {task.timeSpentMinutes && task.timeSpentMinutes > 0 ? (
          <span
            title={`Time logged: ${task.timeSpentMinutes}m`}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-3"
          >
            <ClockIcon className="size-3 text-ink-3" />
            {task.timeSpentMinutes >= 60
              ? `${Math.floor(task.timeSpentMinutes / 60)}h`
              : `${task.timeSpentMinutes}m`}
          </span>
        ) : null}

        {task.subtaskCount && task.subtaskCount.total > 0 ? (
          <span
            title={`${task.subtaskCount.done} of ${task.subtaskCount.total} subtasks completed`}
            className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-ink-3"
          >
            <CheckSquareIcon className="size-3 text-ink-3" />
            <span>
              {task.subtaskCount.done}/{task.subtaskCount.total}
            </span>
          </span>
        ) : null}

        <span className="flex-1" />
        <DueDate value={task.dueAt} done={done} className="text-[11px]" />
      </div>
    </Link>
  );
};
