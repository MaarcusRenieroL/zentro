import { FC } from "react";

import type { DashboardScheduleItem } from "~/src/lib/dashboard-data";

type Props = {
  schedule: DashboardScheduleItem[];
};

export const CalendarSection: FC<Props> = ({ schedule }) => {
  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">Today</h2>
      </div>

      {schedule.length ? (
        <div className="divide-y divide-border">
          {schedule.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-4"
            >
              <p className="text-sm text-muted-foreground">{event.time}</p>
              <div className="min-w-0 flex-1 border-l border-border pl-4">
                <p className="truncate text-sm font-medium text-foreground">
                  {event.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.duration}
                </p>
              </div>
              <div className="hidden shrink-0 -space-x-2 sm:flex">
                {Array.from({ length: Math.min(event.attendees, 3) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="flex size-7 items-center justify-center rounded-full border border-background bg-secondary text-xs font-medium text-foreground"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ),
                )}
                {event.attendees > 3 && (
                  <div className="flex size-7 items-center justify-center rounded-full border border-background bg-secondary text-xs font-medium text-foreground">
                    +{event.attendees - 3}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-background/50 px-4 py-8 text-center">
          <p className="text-sm font-medium">No events today</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Calendar integrations will appear here once connected.
          </p>
        </div>
      )}
    </section>
  );
};
