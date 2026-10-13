import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckSquareIcon,
  FileTextIcon,
  MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { FC } from "react";

import type { DashboardActivityItem } from "~/src/lib/dashboard-data";

type Props = {
  items: DashboardActivityItem[];
};

const iconByKind = {
  created: FileTextIcon,
  updated: CheckSquareIcon,
  completed: CheckCircle2Icon,
  commented: MessageCircleIcon,
};

export const RecentActivitySection: FC<Props> = ({ items }) => {
  return (
    <section className="h-full rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">
          Recent activity
        </h2>
      </div>

      {items.length ? (
        <div className="divide-y divide-border">
          {items.map((activity) => {
            const Icon = iconByKind[activity.kind] ?? AlertCircleIcon;

            return (
              <Link
                key={activity.id}
                href={activity.href}
                className="group flex min-w-0 items-start gap-3 py-4 first:pt-0 last:pb-0 sm:items-center sm:gap-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                  {activity.userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground sm:truncate">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">
                      {activity.action}
                    </span>
                    {activity.target ? (
                      <>
                        {" "}
                        <span className="font-medium">{activity.target}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.app} · {activity.time}
                  </p>
                </div>
                <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[calc(100%-2.25rem)] min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-background/50 px-4 text-center">
          <AlertCircleIcon className="mb-3 size-9 text-muted-foreground" />
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Changes and comments will show up here once your workspace gets
            moving.
          </p>
        </div>
      )}
    </section>
  );
};
