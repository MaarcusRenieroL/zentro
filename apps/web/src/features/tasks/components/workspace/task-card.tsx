import { paths } from "~/src/lib/paths";
import Link from "next/link";
import { FC } from "react";

import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { initialsOf } from "@zentro/ui/lib/tone";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";

import { WorkspaceTask } from "~/src/features/tasks/lib/types";

type Props = {
  task: WorkspaceTask;
};

export const TaskCard: FC<Props> = ({ task }) => {
  const assigned = task.assignee !== "Unassigned";

  return (
    <Link
      href={paths.task(task.key)}
      className="group block rounded-xl border border-hairline bg-surface p-3.5 shadow-(--edge-highlight) transition-colors duration-(--duration-fast) hover:border-line-strong"
    >
      <div className="flex items-center gap-2">
        <StatusGlyph status={task.status} size={14} />
        <TaskKey>{task.key}</TaskKey>
      </div>

      <p className="mt-1 line-clamp-2 text-sm leading-5 font-medium text-ink">
        {task.title}
      </p>

      <div className="mt-3.5 flex items-center gap-2 text-xs text-ink-2">
        <PriorityGlyph priority={task.priority} size={16} />
        <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
          {task.dueDate || "No due date"}
        </span>
        {assigned ? (
          <Avatar className="size-6" title={task.assignee}>
            <AvatarFallback seed={task.assignee}>
              {initialsOf(task.assignee)}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </Link>
  );
};
