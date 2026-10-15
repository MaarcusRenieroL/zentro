import Link from "next/link";
import { FC } from "react";

import { PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { DueDate } from "~/src/components/due-date";
import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

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
        "group flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-3 outline-none hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring",
        done && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-ink-3">{task.key}</span>
        <span className="flex-1" />
        {assigned ? (
          <span title={task.assignee}>
            <ActorAvatar name={task.assignee} size={20} />
          </span>
        ) : null}
      </div>

      <p className="line-clamp-2 text-sm leading-5 font-medium text-ink">
        {task.title}
      </p>

      <div className="mt-1 flex items-center gap-2 text-xs text-ink-2">
        <PriorityMeter priority={task.priority} />
        <span className="flex-1" />
        <DueDate value={task.dueAt} done={done} />
      </div>
    </Link>
  );
};
