"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { useChatSidebar } from "./chat-store";
import { dayHeading, MessageBody, messageTime } from "./message-body";
import { Avatar } from "./message-item";

type Mention = inferRouterOutputs<AppRouter>["chat"]["mentions"][number];

/** Everything that @-mentioned you, newest first. */
export function MentionsView() {
  const trpc = useTrpcClient();
  const sidebar = useChatSidebar();
  const [items, setItems] = useState<Mention[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    try {
      setItems(await trpc.chat.mentions.query({ unreadOnly: false }));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = items?.filter((item) => item.unread).length ?? 0;
  const shown = useMemo(
    () =>
      (tab === "unread" ? items?.filter((item) => item.unread) : items) ?? [],
    [items, tab],
  );
  const days = useMemo(() => {
    const groups: Array<{ label: string; rows: Mention[] }> = [];

    for (const item of shown) {
      const label = dayHeading(item.createdAt);
      const last = groups[groups.length - 1];

      if (last?.label === label) last.rows.push(item);
      else groups.push({ label, rows: [item] });
    }

    return groups;
  }, [shown]);

  const markAll = async () => {
    try {
      await trpc.chat.markMentionsRead.mutate();
      await Promise.all([load(), sidebar.refresh()]);
    } catch (error) {
      toastError(error, "Could not mark them read");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-tint-teams font-mono">
          @
        </span>
        <h2 className="text-xl font-semibold">Mentions</h2>
        {unread ? (
          <span className="rounded-full border border-hairline px-2 py-px font-mono text-xs text-ink-2">
            {unread} unread
          </span>
        ) : null}
        <span className="flex-1" />
        <Button
          variant="outline"
          disabled={!unread}
          onClick={() => void markAll()}
        >
          Mark all read
        </Button>
      </div>

      <div
        role="tablist"
        className="mt-4 flex gap-5 border-b border-hairline text-[15px]"
      >
        {(
          [
            ["all", "All", items?.length ?? 0],
            ["unread", "Unread", unread],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px border-b-2 py-2.5",
              tab === value
                ? "border-ink font-medium"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {label}
            <span className="ml-1.5 font-mono text-xs text-ink-3">{count}</span>
          </button>
        ))}
      </div>

      {items === null && !failed ? (
        <div className="flex flex-col gap-3 pt-5" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-14" />
          ))}
        </div>
      ) : null}

      {failed && !items ? (
        <p className="pt-8 text-center text-[15px] text-ink-2">
          Couldn’t load your mentions.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="text-signal-strong underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}

      {items && shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-serif-italic text-[2rem] leading-10">
            {tab === "unread" ? "You’re all caught up." : "No mentions yet."}
          </p>
          <p className="max-w-sm text-[15px] text-ink-2">
            When someone writes @you, @channel or @here in a conversation, it
            shows up here.
          </p>
        </div>
      ) : null}

      {days.map((day) => (
        <section key={day.label} className="flex flex-col pt-4">
          <h3 className="eyebrow px-3 pb-1.5">{day.label}</h3>
          {day.rows.map((item) => (
            <Link
              key={item.id}
              href={`/chat/${item.channelName ?? `dm/${item.channelId}`}?m=${item.id}`}
              className="flex gap-3 rounded-lg border-t border-hairline/60 px-3 py-3 hover:bg-hover"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-3 size-[7px] shrink-0 rounded-full",
                  item.unread ? "bg-ink" : "bg-transparent",
                )}
              />
              <Avatar name={item.author?.name ?? "Someone"} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{item.author?.name}</span>{" "}
                  <span className="text-ink-2">in</span>{" "}
                  <span className="font-mono text-[13px] text-signal-strong">
                    {item.channelName
                      ? `#${item.channelName}`
                      : "a direct message"}
                  </span>
                </p>
                <p className="line-clamp-2 text-[15px] leading-6">
                  <MessageBody body={item.body} names={item.names} />
                </p>
              </div>
              <span className="font-mono text-xs text-ink-3">
                {messageTime(item.createdAt)}
              </span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
