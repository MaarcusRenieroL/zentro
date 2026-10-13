import { CheckSquareIcon, FileIcon, FolderIcon, UsersIcon } from "lucide-react";
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

const activityClassByKind = {
  tasks: "text-purple-500",
  docs: "text-blue-500",
};

const workspaceIconByLabel = {
  Members: UsersIcon,
  Projects: FolderIcon,
  "Open tasks": CheckSquareIcon,
  Docs: FileIcon,
  Teams: UsersIcon,
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
    <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] xl:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {greeting}, {name}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Here&apos;s what&apos;s happening in {orgName} today.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-wrap xl:items-center">
          {activityPills.map((stat) => {
            const Icon = activityIconByKind[stat.kind];

            return (
              <div
                key={stat.kind}
                className="flex h-11 min-w-0 items-center gap-2 rounded-md border bg-card/70 px-3 text-sm shadow-sm sm:px-4"
              >
                <Icon
                  className={`size-4 shrink-0 ${activityClassByKind[stat.kind]}`}
                />
                <p className="truncate">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-medium">Workspace overview</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {workspaceStats.map((stat) => {
            const Icon =
              workspaceIconByLabel[
                stat.label as keyof typeof workspaceIconByLabel
              ] ?? FolderIcon;

            return (
              <div
                key={stat.label}
                className="flex min-w-0 items-center gap-3 rounded-md border bg-background/60 p-3"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-2xl font-semibold leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
