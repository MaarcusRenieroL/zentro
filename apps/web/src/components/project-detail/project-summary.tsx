import { FC } from "react";

import type { WorkspaceTask } from "~/src/features/tasks/lib/types";

type Props = {
  /** Null while the project's tasks are loading. */
  tasks: WorkspaceTask[] | null;
  totalDocs: number;
};

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="tile flex flex-col gap-0.5 px-[18px] py-4">
      <span className="eyebrow">{label}</span>
      <span className="font-serif-italic text-[44px] leading-12">{value}</span>
      <span className="truncate text-[13px] text-ink-2">{note}</span>
    </div>
  );
}

const weekMs = 7 * 24 * 60 * 60 * 1000;

export const ProjectSummary: FC<Props> = ({ tasks, totalDocs }) => {
  const now = Date.now();
  const open = tasks?.filter((task) => task.status !== "done") ?? [];
  const inProgress = open.filter((task) => task.status === "in-progress");
  const inReview = open.filter((task) => task.status === "review");
  const done = (tasks?.length ?? 0) - open.length;
  const dueSoon = open
    .filter((task) => task.dueAt)
    .filter((task) => {
      const due = new Date(task.dueAt!).getTime();
      return due >= now - 24 * 60 * 60 * 1000 && due <= now + weekMs;
    })
    .sort(
      (a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
    );
  const dash = tasks ? undefined : "–";

  return (
    <div className="grid w-full grid-cols-2 gap-3 xl:grid-cols-4">
      <Stat
        label="Open tasks"
        value={dash ?? open.length}
        note={`${inProgress.length} in progress · ${inReview.length} in review`}
      />
      <Stat
        label="Done"
        value={dash ?? done}
        note={done === 1 ? "task finished" : "tasks finished"}
      />
      <Stat
        label="Due this week"
        value={dash ?? dueSoon.length}
        note={
          dueSoon[0] ? `${dueSoon[0].key} is the next due` : "Nothing due soon"
        }
      />
      <Stat
        label="Docs"
        value={totalDocs}
        note={totalDocs === 1 ? "doc linked" : "docs linked"}
      />
    </div>
  );
};
