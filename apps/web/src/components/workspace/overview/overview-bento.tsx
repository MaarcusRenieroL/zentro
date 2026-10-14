import Link from "next/link";
import {
  BookOpenIcon,
  CheckSquareIcon,
  FolderIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { FC } from "react";

import { DotMatrix } from "@zentro/ui/components/dot-matrix";
import { Stat } from "@zentro/ui/components/stat";
import { Thread, ThreadItem } from "@zentro/ui/components/thread";
import { Tile, type TileTint } from "@zentro/ui/components/tile";
import { initialsOf } from "@zentro/ui/lib/tone";

import type { DashboardData } from "~/src/lib/dashboard-data";
import type { TodayData } from "~/src/lib/today-data";

type Props = {
  orgName: string;
  data: DashboardData;
  week: TodayData["week"];
};

const statStyle: Record<string, { tint: TileTint; icon: FC }> = {
  Members: { tint: "teams", icon: () => <UsersIcon /> },
  Projects: { tint: "projects", icon: () => <FolderIcon /> },
  "Open tasks": { tint: "tasks", icon: () => <CheckSquareIcon /> },
  Docs: { tint: "docs", icon: () => <BookOpenIcon /> },
  Teams: { tint: "teams", icon: () => <UsersRoundIcon /> },
};

/** The workspace numbers for owners and admins, as a bento grid. */
export const OverviewBento: FC<Props> = ({ orgName, data, week }) => {
  const trends: Record<string, string | undefined> = {
    "Open tasks": data.activityPills.find((pill) => pill.kind === "tasks")
      ?.label,
    Docs: data.activityPills.find((pill) => pill.kind === "docs")?.label,
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">{orgName}</p>
        <h1 className="font-display text-4xl leading-tight text-ink">
          Overview
        </h1>
      </header>

      <section
        aria-labelledby="workspace-overview"
        className="flex flex-col gap-3"
      >
        <h2 id="workspace-overview" className="text-sm font-semibold text-ink">
          Workspace overview
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {data.workspaceStats.map((stat) => {
            const style = statStyle[stat.label];
            const Icon = style?.icon;

            return (
              <Tile
                key={stat.label}
                tint={style?.tint ?? "projects"}
                icon={Icon ? <Icon /> : <FolderIcon />}
                className="min-w-0"
              >
                <Stat
                  label={stat.label}
                  value={stat.value}
                  trend={trends[stat.label]}
                />
              </Tile>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tile title="Recent activity" tint="audit">
          {data.recentActivity.length ? (
            <Thread>
              {data.recentActivity.map((activity, index) => (
                <ThreadItem
                  key={activity.id}
                  active={index === 0}
                  node={
                    index === 0 ? undefined : (
                      <span className="flex size-6 items-center justify-center rounded-full bg-sunken text-[0.625rem] font-semibold text-ink-2">
                        {initialsOf(activity.user)}
                      </span>
                    )
                  }
                >
                  <Link href={activity.href} className="group block min-w-0">
                    <p className="text-sm text-ink group-hover:text-signal">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-ink-2">{activity.action}</span>
                    </p>
                    <p className="font-mono text-[11px] text-ink-3 uppercase">
                      {activity.app} · {activity.time}
                    </p>
                  </Link>
                </ThreadItem>
              ))}
            </Thread>
          ) : (
            <p className="py-6 text-sm text-ink-2">
              Changes and comments will show up here once your workspace gets
              moving.
            </p>
          )}
        </Tile>

        <Tile title="Task activity, last 7 days">
          <DotMatrix
            label="Task activity over the last seven days"
            values={week.map((day) => day.count)}
            labels={week.map((day) => day.label)}
          />
        </Tile>
      </div>
    </div>
  );
};
