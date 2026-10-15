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
  | { projectId: string }
  | { teamId: string };

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

/** A team's recent activity as a compact timeline. */
export const TeamActivity: FC<{ teamId: string }> = ({ teamId }) => {
  const trpc = useTrpcClient();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);

  useEffect(() => {
    let live = true;

    void trpcResult(trpc.activity.list.query({ teamId })).then(({ data }) => {
      if (live) setEvents(((data?.items ?? []) as FeedEvent[]).slice(0, 8));
    });

    return () => {
      live = false;
    };
  }, [trpc, teamId]);

  if (!events) return <Skeleton className="h-40 w-full" />;

  if (!events.length) {
    return (
      <p className="text-sm text-ink-2">
        Nothing yet. Work on this team&apos;s tasks and docs shows up here.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3.5" data-testid="activity-feed">
      {events.map((event) => {
        const sentence = sentenceFor(event);
        const finished = /done|complet|finish/i.test(
          `${event.action} ${JSON.stringify(event.metadata)}`,
        );
        const started = /progress|start/i.test(
          `${event.action} ${JSON.stringify(event.metadata)}`,
        );

        return (
          <li key={event.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={
                finished
                  ? "mt-1 size-2.5 shrink-0 rounded-full bg-success"
                  : started
                    ? "mt-1 size-2.5 shrink-0 rounded-full border-2 border-warning"
                    : "mt-1 size-2.5 shrink-0 rounded-full border border-ink-3"
              }
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm break-words">{sentence}</span>
              <span className="font-mono text-[11px] text-ink-3">
                {formatEventTime(event.createdAt)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};
