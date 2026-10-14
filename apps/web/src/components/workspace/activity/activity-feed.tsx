"use client";

import { formatEventTime } from "@zentro/utils";
import { FC, useCallback, useEffect, useState } from "react";

import { actorName, describeEvent } from "@zentro/audit";
import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { trpcResult } from "~/src/lib/trpc-result";

export type FeedSelector =
  | { targetType: string; targetId: string }
  | { projectId: string };

type FeedEvent = {
  id: string;
  action: string;
  targetType: string;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
};

/** The sentence for an event, with deleted users and the system named. */
export function sentenceFor(event: FeedEvent) {
  const actor = actorName(
    event.actorName || event.actorEmail
      ? { name: event.actorName, email: event.actorEmail }
      : null,
    event.actorUserId,
  );

  return describeEvent(event, actor);
}

/** A resource's activity from the unified feed, with "Load more". */
export const ActivityFeed: FC<{
  selector: FeedSelector;
  emptyText?: string;
}> = ({ selector, emptyText = "No activity yet." }) => {
  const trpc = useTrpcClient();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const key = JSON.stringify(selector);

  const load = useCallback(
    async (next?: string) => {
      const { data } = await trpcResult(
        trpc.activity.list.query({
          ...(JSON.parse(key) as FeedSelector),
          cursor: next,
        }),
      );

      setEvents((current) =>
        next
          ? [...(current ?? []), ...((data?.items ?? []) as FeedEvent[])]
          : ((data?.items ?? []) as FeedEvent[]),
      );
      setCursor(data?.nextCursor ?? null);
    },
    [trpc, key],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!events) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!events.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-3" data-testid="activity-feed">
      <ul className="divide-y rounded-md border">
        {events.map((event) => (
          <li key={event.id} className="px-3 py-2 text-sm">
            <p className="break-words">{sentenceFor(event)}</p>
            <p className="text-xs text-muted-foreground">
              {formatEventTime(event.createdAt)}
            </p>
          </li>
        ))}
      </ul>
      {cursor ? (
        <Button variant="outline" size="sm" onClick={() => load(cursor)}>
          Load more
        </Button>
      ) : null}
    </div>
  );
};
