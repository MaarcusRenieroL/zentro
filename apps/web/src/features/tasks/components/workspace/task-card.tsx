import { paths } from "~/src/lib/paths";
import Link from "next/link";
import { FC } from "react";

import { PriorityGlyph } from "@zentro/ui/components/status-glyph";
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
      className="group block rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-hairline/60 transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-md"
    >
      <p className="font-mono text-xs text-ink-3">{task.key}</p>

      <p className="mt-1 line-clamp-2 text-sm leading-5 font-medium text-ink">
        {task.title}
      </p>

      <div className="mt-3.5 flex items-center gap-2 text-xs text-ink-2">
        <PriorityGlyph priority={task.priority} size={16} />
        <span className="min-w-0 flex-1 truncate">
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
