import Link from "next/link";
import { FC } from "react";

import { Thread, ThreadItem } from "@zentro/ui/components/thread";

import type { DashboardActivityItem } from "~/src/lib/dashboard-data";

type Props = {
  items: DashboardActivityItem[];
};

export const RecentActivitySection: FC<Props> = ({ items }) => {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-hairline/60">
      <h2 className="mb-4 font-display text-xl text-ink">Recent activity</h2>

      {items.length ? (
        <Thread>
          {items.map((activity) => (
            <ThreadItem
              key={activity.id}
              node={
                <span className="flex size-6 items-center justify-center rounded-full bg-signal-subtle text-[0.625rem] font-semibold text-signal">
                  {activity.userInitials}
                </span>
              }
            >
              <Link href={activity.href} className="group block min-w-0">
                <p className="text-sm text-ink group-hover:text-signal">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-ink-2">{activity.action}</span>
                  {activity.target ? (
                    <>
                      {" "}
                      <span className="font-medium">{activity.target}</span>
                    </>
                  ) : null}
                </p>
                <p className="text-xs text-ink-3">
                  {activity.app} · {activity.time}
                </p>
              </Link>
            </ThreadItem>
          ))}
        </Thread>
      ) : (
        <div className="rounded-2xl bg-sunken px-4 py-10 text-center">
          <p className="text-sm font-medium text-ink">No activity yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-2">
            Changes and comments will show up here once your workspace gets
            moving.
          </p>
        </div>
      )}
    </section>
  );
};
