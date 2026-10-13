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
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ActivityIcon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-sm leading-5">
          <span className="font-medium">{event.actor}</span>{" "}
          <span className="text-muted-foreground">{event.action}</span>{" "}
          <span className="font-medium">{event.target}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{event.time}</p>
      </div>
    </div>
  );
};

export const ActivityFeed = ({ events }: Props) => {
  const previewEvents = events.slice(0, 3);

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>
            Latest task updates across your workspace.
          </CardDescription>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <ExternalLinkIcon className="size-3.5" />
              View all
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
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
