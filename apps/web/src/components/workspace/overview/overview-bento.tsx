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
  projectRows: Array<{
    name: string;
    slug: string;
    open: number;
    done: number;
  }>;
  teamRows: Array<{
    id: string;
    name: string;
    projects: number;
    people: number;
  }>;
};

const statStyle: Record<string, { tint: TileTint; icon: FC }> = {
  Members: { tint: "teams", icon: () => <UsersIcon /> },
  Projects: { tint: "projects", icon: () => <FolderIcon /> },
  "Open tasks": { tint: "tasks", icon: () => <CheckSquareIcon /> },
  Docs: { tint: "docs", icon: () => <BookOpenIcon /> },
  Teams: { tint: "teams", icon: () => <UsersRoundIcon /> },
};

/** The workspace numbers for owners and admins, as a bento grid. */
export const OverviewBento: FC<Props> = ({
  orgName,
  data,
  week,
  projectRows,
  teamRows,
}) => {
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
      {projectRows.length > 0 || teamRows.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {projectRows.length > 0 ? (
            <Tile title="By project" tint="projects" flush>
              <table className="w-full text-sm">
                <thead>
                  <tr className="eyebrow border-b border-hairline text-left">
                    <th className="px-(--pad-tile) py-2 font-medium">
                      Project
                    </th>
                    <th className="px-2 py-2 text-right font-medium">Open</th>
                    <th className="px-2 py-2 text-right font-medium">Done</th>
                    <th className="w-28 px-(--pad-tile) py-2 font-medium">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectRows.map((row) => {
                    const total = row.open + row.done;
                    const pct = total
                      ? Math.round((row.done / total) * 100)
                      : 0;

                    return (
                      <tr
                        key={row.slug}
                        className="border-b border-hairline/60 last:border-b-0 hover:bg-hover"
                      >
                        <td className="px-(--pad-tile) py-2.5">
                          <Link
                            href={`/projects/${row.slug}`}
                            className="font-medium hover:text-signal"
                          >
                            {row.name}
                          </Link>
                        </td>
                        <td className="px-2 text-right font-mono text-xs">
                          {row.open}
                        </td>
                        <td className="px-2 text-right font-mono text-xs">
                          {row.done}
                        </td>
                        <td className="px-(--pad-tile)">
                          <span
                            role="progressbar"
                            aria-label={`${row.name}: ${pct}% done`}
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="block h-1.5 overflow-hidden rounded-full bg-sunken"
                          >
                            <span
                              className="block h-full bg-status-done"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Tile>
          ) : null}

          {teamRows.length > 0 ? (
            <Tile title="By team" tint="teams" flush>
              <table className="w-full text-sm">
                <thead>
                  <tr className="eyebrow border-b border-hairline text-left">
                    <th className="px-(--pad-tile) py-2 font-medium">Team</th>
                    <th className="px-2 py-2 text-right font-medium">People</th>
                    <th className="px-(--pad-tile) py-2 text-right font-medium">
                      Projects
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-hairline/60 last:border-b-0 hover:bg-hover"
                    >
                      <td className="px-(--pad-tile) py-2.5 font-medium">
                        {row.name}
                      </td>
                      <td className="px-2 text-right font-mono text-xs">
                        {row.people}
                      </td>
                      <td className="px-(--pad-tile) text-right font-mono text-xs">
                        {row.projects}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tile>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
