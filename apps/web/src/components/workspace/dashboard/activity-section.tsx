import {
  CheckSquareIcon,
  FileIcon,
  FolderIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import { FC } from "react";

import type {
  DashboardActivityPill,
  DashboardStat,
} from "~/src/lib/dashboard-data";

type Props = {
  activityPills: DashboardActivityPill[];
  name: string;
  orgName: string;
  workspaceStats: DashboardStat[];
};

const activityIconByKind = {
  tasks: CheckSquareIcon,
  docs: FileIcon,
};

const workspaceIconByLabel = {
  Members: UsersIcon,
  Projects: FolderIcon,
  "Open tasks": CheckSquareIcon,
  Docs: FileIcon,
  Teams: UsersRoundIcon,
};

export const ActivitySection: FC<Props> = ({
  activityPills,
  name,
  orgName,
  workspaceStats,
}) => {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative isolate overflow-hidden rounded-3xl bg-signal-subtle p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-radial-[ellipse_60%_100%_at_100%_0%] from-signal/20 to-transparent"
        />
        <p className="text-sm font-medium text-signal">{orgName}</p>
        <h1 className="mt-1 font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
          {greeting}, {name}
        </h1>
        <p className="mt-2 max-w-xl text-ink-2">
          Here&apos;s what&apos;s happening in {orgName} today.
        </p>

        {activityPills.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {activityPills.map((stat) => {
              const Icon = activityIconByKind[stat.kind];

              return (
                <span
                  key={stat.kind}
                  className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-ink shadow-sm"
                >
                  <Icon className="size-4 text-signal" />
                  {stat.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <section aria-labelledby="workspace-overview">
        <h2
          id="workspace-overview"
          className="mb-2 px-1 text-sm font-medium text-ink-2"
        >
          Workspace overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {workspaceStats.map((stat) => {
            const Icon =
              workspaceIconByLabel[
                stat.label as keyof typeof workspaceIconByLabel
              ] ?? FolderIcon;

            return (
              <div
                key={stat.label}
                className="flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-hairline/60"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-sunken text-ink-2">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-3xl leading-none text-ink tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 truncate text-sm text-ink-2">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
