"use client";

import Link from "next/link";
import { FC, useEffect, useState, type ReactNode } from "react";
import { SearchIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { ActivityFeed } from "~/src/components/workspace/activity/activity-feed";
import { DocTable } from "~/src/features/docs/components/doc-rows";
import type { DocsListItem } from "~/src/features/docs/lib/docs";
import { ListView } from "~/src/features/tasks/components/workspace/list-view";
import type { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

type Props = {
  projectId: string;
  projectSlug: string;
  description?: string | null;
  tasks: WorkspaceTask[];
  totalDocs: number;
  // A tab is only offered when its module is enabled.
  showTasks?: boolean;
  showDocs?: boolean;
  /** Beside every tab: details and the Thread. */
  aside?: ReactNode;
  /** The Overview's brief: who leads it, when it last changed, who works on it. */
  brief?: {
    owner: string;
    updatedAt: Date;
    editHref?: string | null;
    contributors: ReactNode;
  };
};

type TabId = "overview" | "tasks" | "docs" | "activity";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tile flex flex-col gap-4 p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ProjectTasks({
  tasks,
  projectSlug,
}: {
  tasks: WorkspaceTask[];
  projectSlug: string;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(needle) ||
          task.key.toLowerCase().includes(needle),
      )
    : tasks;
  const open = tasks.filter((task) => task.status !== "done").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative h-8 w-full min-w-0 sm:w-60">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tasks"
            aria-label="Filter tasks"
            className="h-full w-full rounded-xl border border-hairline bg-surface pr-2.5 pl-8 text-[13px] outline-none placeholder:text-ink-3 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/22"
          />
        </div>
        <span className="font-mono text-xs text-ink-3">{open} open</span>
        <span className="flex-1" />
        <Link
          href={paths.tasksForProject(projectSlug)}
          className="text-[13px] text-signal hover:underline"
        >
          Open in Tasks
        </Link>
      </div>
      <ListView tasks={shown} />
    </div>
  );
}

function ProjectDocsList({ projectId }: { projectId: string }) {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    trpc.docs.getAll
      .query({})
      .then((data) => {
        if (isMounted) {
          setDocs(data.filter((doc) => doc.projectId === projectId));
        }
      })
      .catch(() => isMounted && setFailed(true));

    return () => {
      isMounted = false;
    };
  }, [projectId, trpc]);

  if (failed) {
    return (
      <p className="text-sm text-ink-2">
        Docs could not be loaded. They are safe; reload to try again.
      </p>
    );
  }

  if (!docs) return <Skeleton className="h-40 rounded-xl" />;

  if (!docs.length) {
    return (
      <p className="text-sm text-ink-2">No docs linked to this project.</p>
    );
  }

  return <DocTable docs={docs} />;
}

export const ProjectTabs: FC<Props> = ({
  projectId,
  projectSlug,
  description,
  tasks,
  totalDocs,
  showTasks = true,
  showDocs = true,
  aside,
  brief,
}) => {
  const [tab, setTab] = useState<TabId>("overview");

  const tabs: Array<{
    id: TabId;
    label: string;
    count?: number;
  }> = [
    { id: "overview", label: "Overview" },
    ...(showTasks
      ? [
          {
            id: "tasks" as const,
            label: "Tasks",
            count: tasks.length,
          },
        ]
      : []),
    ...(showDocs
      ? [
          {
            id: "docs" as const,
            label: "Docs",
            count: totalDocs,
          },
        ]
      : []),
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Project sections"
        className="hide-scrollbar flex gap-5 overflow-x-auto border-b border-hairline text-[15px]"
      >
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 py-2.5 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === id
                ? "border-ink font-medium text-ink"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {label}
            {count !== undefined ? (
              <span className="font-mono text-xs text-ink-3">{count}</span>
            ) : null}
          </button>
        ))}
        {/* Planned: shown dim so the tab bar tells the truth. */}
        <span
          aria-disabled="true"
          className="-mb-px flex items-center gap-1.5 border-b-2 border-transparent py-2.5 whitespace-nowrap text-ink-3"
        >
          Files
          <span className="rounded-lg border border-dashed border-hairline px-1.5 font-mono text-[11px]">
            Coming
          </span>
        </span>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div role="tabpanel" className="min-w-0">
          {tab === "overview" ? (
            <div className="flex flex-col gap-7">
              <section
                aria-label="Project brief"
                className="tile px-6 pt-5 pb-6"
              >
                <div className="flex flex-wrap items-baseline gap-2.5 pb-3">
                  <h2 className="text-base font-semibold">Project brief</h2>
                  {brief ? (
                    <span className="font-mono text-xs text-ink-3">
                      {brief.owner} · updated{" "}
                      {brief.updatedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : null}
                  <span className="flex-1" />
                  {brief?.editHref ? (
                    <Link
                      href={brief.editHref}
                      className="rounded-xs text-[13px] text-signal hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
                {description ? (
                  <div className="flex flex-col gap-3 text-[15px] leading-6 whitespace-pre-line">
                    {description}
                  </div>
                ) : (
                  <p className="text-[15px] leading-6 text-ink-3">
                    No brief yet. Write the goal, what is in and out of scope,
                    and when this project is done.
                  </p>
                )}
              </section>
              {brief?.contributors}
            </div>
          ) : null}

          {tab === "tasks" ? (
            <ProjectTasks tasks={tasks} projectSlug={projectSlug} />
          ) : null}

          {tab === "docs" ? <ProjectDocsList projectId={projectId} /> : null}

          {tab === "activity" ? (
            <Panel title="Activity">
              <ActivityFeed
                selector={{ projectId }}
                emptyText="Nothing has happened in this project yet."
              />
            </Panel>
          ) : null}
        </div>
        {aside ? (
          <aside className="flex min-w-0 flex-col gap-4">{aside}</aside>
        ) : null}
      </div>
    </div>
  );
};
