"use client";

import { ActivityIcon, ExternalLinkIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";
import { ActivityEvent } from "~/src/features/tasks/lib/types";

type Props = {
  events: ActivityEvent[];
};

const ActivityItem = ({ event }: { event: ActivityEvent }) => {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal mt-0.5">
        <ActivityIcon className="size-3.5" />
      </div>

      <div className="min-w-0">
        <p className="text-[13px] leading-snug">
          <span className="font-semibold text-ink">{event.actor}</span>{" "}
          <span className="text-ink-3">{event.action}</span>{" "}
          <span className="font-medium text-ink-2">{event.target}</span>
        </p>
        <p className="mt-1 font-mono text-[11px] text-ink-3">{event.time}</p>
      </div>
    </div>
  );
};

export const ActivityFeed = ({ events }: Props) => {
  const previewEvents = events.slice(0, 3);

  return (
    <Card className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 shadow-2xs">
      <CardHeader className="p-0 pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-[15px] font-semibold text-ink">
            Recent activity
          </CardTitle>
          <CardDescription className="text-xs text-ink-3">
            Latest task updates across your workspace.
          </CardDescription>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-lg border-hairline px-2.5 text-xs font-medium"
            >
              <ExternalLinkIcon className="size-3" />
              View all
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl border-hairline sm:max-w-2xl">
            <DialogHeader className="shrink-0">
              <DialogTitle>All activity</DialogTitle>
              <DialogDescription>
                Task activity across teams, projects, and assignments.
              </DialogDescription>
            </DialogHeader>

            <div className="-mr-2 min-h-0 space-y-4 overflow-y-auto pr-2">
              {events.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewEvents.length ? (
          previewEvents.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))
        ) : (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No task activity yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
