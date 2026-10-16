"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  CircleIcon,
  PlusIcon,
  Settings2Icon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { ActorAvatar } from "~/src/components/actor-avatar";
import { DueDate } from "~/src/components/due-date";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { usePageCrumb } from "~/src/components/shell/breadcrumb-context";
import { TeamActivity } from "~/src/components/workspace/activity/activity-feed";
import { paths } from "~/src/lib/paths";
import {
  TeamWorkloadBalancer,
  type MemberCapacity,
  type WorkloadTask,
} from "./team-workload-balancer";

type WorkloadData = {
  team: {
    id: string;
    name: string;
  };
  totalTasks: number;
  openTasksCount: number;
  doneTasksCount: number;
  memberWorkload: MemberCapacity[];
  tasks: WorkloadTask[];
};

type Data = {
  team: {
    id: string;
    name: string;
    description: string | null;
    members: Array<{
      memberId: string;
      userId: string;
      name: string;
      role: string;
    }>;
  };
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    taskKeyPrefix: string;
    totalTasks: number | null;
    doneTasks: number | null;
  }>;
  tasks: Array<{
    key: string;
    name: string;
    status: string;
    due: Date | null;
    assigneeUserId: string | null;
  }>;
  docs: Array<{ updatedAt: Date }>;
  workload: WorkloadData | null;
};

const DAY = 24 * 60 * 60 * 1000;

/** One team: its numbers, projects, people and what happened lately. */
export function TeamDetail({ teamId }: { teamId: string }) {
  const trpc = useTrpcClient();
  const [data, setData] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const canEdit = usePermission("teams.update", { teamId });
  const canManage = usePermission("teams.members.manage", { teamId });

  usePageCrumb(paths.teamSettings(teamId), data?.team.name);

  useEffect(() => {
    let live = true;

    Promise.all([
      trpc.team.getAll.query(),
      // Turned-off modules reject these calls; they simply show as empty.
      trpc.project.getProjectsByOrgId.query().catch(() => []),
      trpc.task.getTasksByOrgId.query({ teamId }).catch(() => []),
      trpc.docs.getAll.query({ teamId }).catch(() => []),
      trpc.team.getTeamWorkload.query({ id: teamId }).catch(() => null),
    ])
      .then(([teams, projects, tasks, docs, workload]) => {
        if (!live) return;

        const team = teams.find((entry) => entry.id === teamId);

        if (!team) {
          setMissing(true);
          return;
        }

        setData({
          team,
          projects: projects.filter(
            (project) => project.teamId === teamId && !project.archivedAt,
          ),
          tasks,
          docs,
          workload,
        });
      })
      .catch(() => live && setMissing(true));

    return () => {
      live = false;
    };
  }, [trpc, teamId, refreshToken]);

  if (missing) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
        <p className="font-serif-italic text-[2rem] leading-10">
          This team isn&apos;t here.
        </p>
        <p className="text-[15px] text-ink-2">
          It may have been deleted, or you don&apos;t have access to it.
        </p>
        <Button asChild variant="outline">
          <Link href={paths.teamsSettings()}>Back to teams</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { team, projects, tasks, docs, workload } = data;
  const now = Date.now();
  const open = tasks.filter((task) => task.status !== "done");
  const started = open.filter((task) => task.status === "in-progress").length;
  const done = tasks.length - open.length;
  const overdue = open.filter(
    (task) => task.due && new Date(task.due).getTime() < now,
  );
  const editedToday = docs.filter(
    (doc) => now - new Date(doc.updatedAt).getTime() < DAY,
  ).length;
  const openFor = (userId: string) =>
    open.filter((task) => task.assigneeUserId === userId).length;
  const editHref = `${paths.teamsSettings()}?edit=${team.id}`;

  const stats = [
    { label: "Open tasks", value: open.length, note: `${started} in progress` },
    { label: "Done", value: done, note: `of ${tasks.length} tasks` },
    {
      label: "Overdue",
      value: overdue.length,
      note: overdue[0]
        ? `${overdue[0].key} · ${overdue[0].name}`
        : "Nothing late",
      tone: overdue.length > 0,
    },
    {
      label: "Docs",
      value: docs.length,
      note: `${editedToday} edited today`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={paths.teamsSettings()}
          className="flex w-fit items-center gap-1 text-[13px] text-ink-2 hover:text-ink"
        >
          <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
          Teams
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-md border border-hairline bg-tint-teams font-mono text-sm"
          >
            {team.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
              {team.name}
            </h1>
            {team.description ? (
              <p className="text-sm text-ink-2">{team.description}</p>
            ) : null}
          </div>
          {canEdit ? (
            <Button asChild variant="outline">
              <Link href={editHref}>
                <Settings2Icon />
                Edit team
              </Link>
            </Button>
          ) : null}
          {canManage ? (
            <Button asChild>
              <Link href={editHref}>
                <PlusIcon />
                Add people
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="tile flex min-w-0 flex-col gap-1 p-4"
          >
            <span className="eyebrow">{stat.label}</span>
            <span
              className={cn(
                "font-serif-italic text-[2.25rem] leading-10",
                stat.tone && "text-danger-text",
              )}
            >
              {stat.value}
            </span>
            <span className="truncate text-xs text-ink-2">{stat.note}</span>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="team-projects" className="flex flex-col">
            <h2
              id="team-projects"
              className="flex items-center gap-2 pb-2 font-semibold"
            >
              Projects
              <span className="font-mono text-xs font-normal text-ink-3">
                {projects.length}
              </span>
            </h2>
            {projects.length ? (
              projects.map((project) => {
                const total = project.totalTasks ?? 0;
                const finished = project.doneTasks ?? 0;

                return (
                  <Link
                    key={project.id}
                    href={paths.project(project.slug)}
                    className="flex items-center gap-3 border-b border-hairline/60 px-1 py-2.5 hover:bg-hover"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-6 items-center justify-center rounded-sm border border-hairline bg-tint-projects font-mono text-[11px]"
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 truncate text-[15px]">
                      {project.name}
                    </span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {project.taskKeyPrefix}
                    </span>
                    <span className="flex-1" />
                    <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-sunken sm:block">
                      <span
                        className="block h-full rounded-full bg-success"
                        style={{
                          width: `${total ? Math.round((finished / total) * 100) : 0}%`,
                        }}
                      />
                    </span>
                    <span className="w-14 text-right font-mono text-xs text-ink-2">
                      {finished}/{total}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="py-3 text-sm text-ink-2">
                No projects belong to this team yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="team-workload-balancer"
            className="flex flex-col"
          >
            <TeamWorkloadBalancer
              teamId={team.id}
              members={workload?.memberWorkload ?? []}
              tasks={workload?.tasks ?? []}
              onTasksUpdated={() => setRefreshToken((t) => t + 1)}
            />
          </section>

          <section aria-labelledby="team-task-stream" className="flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <h2
                id="team-task-stream"
                className="flex items-center gap-2 font-semibold"
              >
                Cross-Project Tasks
                <span className="font-mono text-xs font-normal text-ink-3">
                  {workload?.tasks.length ?? 0}
                </span>
              </h2>
              {workload && workload.totalTasks > 0 ? (
                <span className="font-mono text-xs text-ink-3">
                  {workload.openTasksCount} open · {workload.doneTasksCount}{" "}
                  done
                </span>
              ) : null}
            </div>

            {workload && workload.tasks.length > 0 ? (
              <div className="flex flex-col">
                {workload.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 border-b border-hairline/60 px-1 py-2 hover:bg-hover transition-colors"
                  >
                    <StatusGlyph
                      status={task.status as any}
                      size={12}
                      decorative
                    />
                    <Link
                      href={paths.task(task.key)}
                      className="font-mono text-xs font-medium text-ink-2 hover:text-ink shrink-0"
                    >
                      {task.key}
                    </Link>
                    <Link
                      href={paths.task(task.key)}
                      className="min-w-0 truncate text-sm text-ink hover:underline"
                    >
                      {task.name}
                    </Link>
                    <div className="ml-auto flex items-center gap-2.5 shrink-0">
                      <Link
                        href={paths.project(task.projectSlug)}
                        className="rounded border border-hairline/80 bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-2 hover:text-ink hover:border-hairline"
                      >
                        {task.projectName}
                      </Link>
                      {task.dueAt ? (
                        <DueDate
                          value={task.dueAt}
                          done={task.status === "done"}
                        />
                      ) : null}
                      {task.assigneeName ? (
                        <span className="hidden sm:inline-block max-w-[80px] truncate font-mono text-[11px] text-ink-3">
                          {task.assigneeName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-sm text-ink-2">
                No tasks assigned to this team or its members yet.
              </p>
            )}
          </section>
        </div>

        <section aria-labelledby="team-activity" className="tile p-4">
          <h2 id="team-activity" className="pb-3 font-semibold">
            Activity
          </h2>
          <TeamActivity teamId={team.id} />
        </section>
      </div>
    </div>
  );
}
