import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { FC, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

import type { DashboardData } from "~/src/lib/dashboard-data";
import type { OverviewData, OverviewRow } from "~/src/lib/overview-data";
import { paths } from "~/src/lib/paths";

import { MostDiscussed } from "./most-discussed";

type Props = {
  data: OverviewData;
  activity: DashboardData["recentActivity"];
  canSeeAudit: boolean;
};

/** "↑ 12% vs last week", or "Same as last week". */
function Change({
  now,
  before,
  suffix,
  percent = false,
  bad = false,
}: {
  now: number;
  before: number;
  suffix: string;
  percent?: boolean;
  /** Up is the wrong direction (overdue work). */
  bad?: boolean;
}) {
  const diff = now - before;

  if (diff === 0 && percent) {
    return <Pill>Same as last week</Pill>;
  }

  const value =
    percent && before > 0
      ? `${Math.round((Math.abs(diff) / before) * 100)}%`
      : String(Math.abs(diff));
  const Icon = diff < 0 ? ArrowDownIcon : ArrowUpIcon;

  return (
    <Pill tone={diff > 0 && bad ? "bad" : undefined}>
      {diff !== 0 ? <Icon className="size-3" aria-hidden="true" /> : null}
      {value} {suffix}
    </Pill>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone?: "bad" }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border border-hairline px-2 py-0.5 font-mono text-[11px] text-ink-2",
        tone === "bad" && "text-danger-text",
      )}
    >
      {children}
    </span>
  );
}

function Kpi({
  label,
  value,
  of,
  tone,
  children,
}: {
  label: string;
  value: number;
  of?: number;
  tone?: "bad";
  children: ReactNode;
}) {
  return (
    <div className="tile flex min-w-0 flex-col gap-2 p-4">
      <span className="eyebrow">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-serif-italic text-[2.5rem] leading-[2.75rem]",
            tone === "bad" && value > 0 && "text-danger-text",
          )}
        >
          {value}
        </span>
        {of !== undefined ? (
          <span className="font-mono text-xs text-ink-3">/ {of}</span>
        ) : null}
      </span>
      {children}
    </div>
  );
}

/** Done-task counts as cells: darker green means more finished that day. */
function heatClass(count: number, max: number) {
  if (count === 0) return "bg-sunken text-transparent";

  const level = count / Math.max(max, 1);

  if (level > 0.75) return "bg-success text-on-success";
  if (level > 0.4) return "bg-success/70 text-on-success";

  return "bg-success/35 text-ink";
}

function Breakdown({
  label,
  rows,
  empty,
}: {
  label: string;
  rows: OverviewRow[];
  empty: string;
}) {
  return (
    <div role="table" aria-label={label} className="flex flex-col">
      <div
        role="row"
        className="flex h-9 items-center gap-3 border-b border-hairline px-3 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase"
      >
        <span role="columnheader" className="min-w-0 flex-1">
          {label}
        </span>
        <span role="columnheader" className="w-12 text-right">
          Open
        </span>
        <span role="columnheader" className="hidden w-16 text-right sm:block">
          Done 7d
        </span>
        <span role="columnheader" className="w-16 text-right">
          Overdue
        </span>
        <span role="columnheader" className="hidden w-36 md:block">
          Progress
        </span>
      </div>
      {rows.length ? (
        rows.map((row) => (
          <div
            role="row"
            key={row.id}
            className="relative flex min-h-12 items-center gap-3 border-b border-hairline/60 px-3 hover:bg-hover"
          >
            <span
              role="cell"
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-hairline bg-sunken font-mono text-[11px]"
              >
                {row.name.charAt(0).toUpperCase()}
              </span>
              <Link
                href={row.href}
                className="truncate text-[15px] font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {row.name}
              </Link>
            </span>
            <span role="cell" className="w-12 text-right font-mono text-sm">
              {row.open}
            </span>
            <span
              role="cell"
              className="hidden w-16 text-right font-mono text-sm text-ink-2 sm:block"
            >
              {row.doneWeek}
            </span>
            <span
              role="cell"
              className={cn(
                "w-16 text-right font-mono text-sm",
                row.overdue ? "text-danger-text" : "text-ink-3",
              )}
            >
              {row.overdue ? `◆ ${row.overdue}` : 0}
            </span>
            <span role="cell" className="hidden w-36 md:block">
              <span className="block h-1.5 overflow-hidden rounded-full bg-sunken">
                <span
                  className="block h-full rounded-full bg-success"
                  style={{
                    width: `${row.total ? Math.round((row.done / row.total) * 100) : 0}%`,
                  }}
                />
              </span>
            </span>
          </div>
        ))
      ) : (
        <p className="px-3 py-4 text-sm text-ink-2">{empty}</p>
      )}
    </div>
  );
}

/** The organization at a glance, for owners and admins. */
export const OverviewBoard: FC<Props> = ({ data, activity, canSeeAudit }) => {
  const { kpis } = data;
  const max = Math.max(0, ...data.heatmap.flatMap((row) => row.counts));
  const doneTotal = data.heatmap.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="workspace-numbers">
        <h2 id="workspace-numbers" className="sr-only">
          Workspace numbers
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Kpi label="Tasks done · 7d" value={kpis.doneWeek}>
            <Change
              now={kpis.doneWeek}
              before={kpis.donePrevWeek}
              suffix="vs last week"
              percent
            />
          </Kpi>
          <Kpi label="Open tasks" value={kpis.open}>
            <Pill>
              {kpis.openSinceMonday ? (
                <ArrowUpIcon className="size-3" aria-hidden="true" />
              ) : null}
              {kpis.openSinceMonday} since Monday
            </Pill>
          </Kpi>
          <Kpi label="Overdue" value={kpis.overdue} tone="bad">
            <Pill tone={kpis.overdueSinceMonday ? "bad" : undefined}>
              {kpis.overdueSinceMonday ? (
                <ArrowUpIcon className="size-3" aria-hidden="true" />
              ) : null}
              {kpis.overdueSinceMonday} since Monday
            </Pill>
          </Kpi>
          <Kpi label="Docs edited · 7d" value={kpis.docsWeek}>
            <Change
              now={kpis.docsWeek}
              before={kpis.docsPrevWeek}
              suffix="vs last week"
            />
          </Kpi>
          <Kpi label="Active people" value={kpis.activePeople} of={kpis.people}>
            <Change
              now={kpis.activePeople}
              before={kpis.activePrevWeek}
              suffix="vs last week"
            />
          </Kpi>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section
            aria-labelledby="done-week"
            className="tile flex flex-col gap-4 p-5"
          >
            <div className="flex items-baseline gap-3">
              <h2 id="done-week" className="flex-1 font-semibold">
                Tasks done, last 7 days
              </h2>
              <span className="font-mono text-xs text-ink-3">
                {doneTotal} total
              </span>
            </div>
            {data.heatmap.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] border-separate border-spacing-1 text-sm">
                  <thead>
                    <tr>
                      <th className="w-28" />
                      {data.days.map((day) => (
                        <th
                          key={day.key}
                          scope="col"
                          className={cn(
                            "pb-1 font-mono text-[11px] font-normal text-ink-3",
                            day.today && "font-semibold text-ink",
                          )}
                        >
                          {day.letter}
                        </th>
                      ))}
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.heatmap.map((row) => (
                      <tr key={row.id}>
                        <th
                          scope="row"
                          className="truncate pr-2 text-left font-normal text-ink-2"
                        >
                          {row.name}
                        </th>
                        {row.counts.map((count, index) => (
                          <td
                            key={data.days[index]!.key}
                            className={cn(
                              "h-8 rounded-sm text-center font-mono text-xs",
                              heatClass(count, max),
                            )}
                          >
                            {count || ""}
                          </td>
                        ))}
                        <td className="text-right font-mono text-sm">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-ink-2">
                Make teams and give them work to see who finishes what, day by
                day.
              </p>
            )}
          </section>

          <Breakdown
            label="Project"
            rows={data.projects}
            empty="No projects yet."
          />
          <Breakdown label="Team" rows={data.teams} empty="No teams yet." />
        </div>

        <section
          aria-labelledby="overview-activity"
          className="tile flex flex-col gap-4 p-5"
        >
          <div className="flex items-baseline">
            <h2 id="overview-activity" className="flex-1 font-semibold">
              Activity
            </h2>
            {canSeeAudit ? (
              <Link
                href={paths.auditLogSettings()}
                className="text-sm text-signal-strong hover:underline"
              >
                Audit log
              </Link>
            ) : null}
          </div>
          {activity.length ? (
            <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[4.5px] before:w-px before:bg-hairline">
              {activity.slice(0, 7).map((item) => (
                <li key={item.id} className="relative flex gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full bg-surface",
                      item.kind === "completed"
                        ? "bg-success"
                        : item.kind === "updated"
                          ? "border-2 border-warning"
                          : "border border-ink-3",
                    )}
                  />
                  <Link
                    href={item.href}
                    className="group flex min-w-0 flex-col"
                  >
                    <span className="text-sm group-hover:text-signal">
                      <span className="font-medium">{item.user}</span>{" "}
                      <span className="text-ink-2">{item.action}</span>
                    </span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {item.time}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-2">
              Nothing yet. Changes across the organization show up here.
            </p>
          )}
        </section>

        <MostDiscussed />
      </div>
    </div>
  );
};
