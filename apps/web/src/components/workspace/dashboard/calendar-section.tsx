import Link from "next/link";
import { FC } from "react";

export const CalendarSection: FC = () => {
  const todaySchedule = [
    {
      time: "10:00 AM",
      title: "Design sync",
      duration: "45 min",
      attendees: 3,
    },
    {
      time: "11:00 AM",
      title: "Sprint planning",
      duration: "1h 30m",
      attendees: 5,
    },
    {
      time: "2:00 PM",
      title: "Customer interview",
      duration: "1h",
      attendees: 2,
    },
    {
      time: "4:00 PM",
      title: "Q2 roadmap review",
      duration: "1h",
      attendees: 1,
    },
  ];

  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">Today</h2>
        <Link
          href="/calendar"
          className="text-sm text-primary hover:text-primary/80"
        >
          View calendar
        </Link>
      </div>
      <div className="divide-y divide-border">
        {todaySchedule.map((event, idx) => (
          <div
            key={idx}
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
                <div className="flex size-7 items-center justify-center rounded-full border border-background bg-secondary text-xs font-medium text-muted-foreground">
                  +{event.attendees - 3}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
