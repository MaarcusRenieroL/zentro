"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { toastSuccess } from "@zentro/ui/lib/toast";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { ErrorState } from "@zentro/ui/components/error-state";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { paths } from "~/src/lib/paths";

import {
  ActorAvatar,
  ApprovalActions,
  KindChip,
  NotificationQuote,
  NotificationSentence,
  UnreadDot,
} from "./notification-row";
import {
  clockTime,
  countByKind,
  groupByDay,
  kindGroups,
  type NotificationKind,
} from "./notifications";
import { useNotifications } from "./notifications-provider";

type Tab = "all" | NotificationKind;
export type InboxState = "ready" | "loading" | "error";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All" },
  ...kindGroups.map(({ kind, label }) => ({ id: kind as Tab, label })),
];

export function InboxView({
  state: forced,
  onRetry,
}: {
  /** The dev gallery forces a state; the workspace uses the live one. */
  state?: InboxState;
  onRetry?: () => void;
}) {
  const {
    items,
    unreadCount,
    markAllRead,
    resolve,
    state: live,
    reload,
  } = useNotifications();
  const state = forced ?? live;
  const [tab, setTab] = useState<Tab>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const counts = useMemo(() => countByKind(items), [items]);
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (tab === "all" || item.kind === tab) && (!unreadOnly || item.unread),
      ),
    [items, tab, unreadOnly],
  );
  const days = useMemo(() => groupByDay(visible), [visible]);

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          Notifications
        </h1>
        <span className="rounded-full border border-hairline px-2 py-px font-mono text-xs text-ink-2">
          {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
        </span>
        <div className="flex-1" />
        <Link
          href={paths.settings()}
          className="rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Notification settings
        </Link>
        <Button
          variant="outline"
          disabled={unreadCount === 0}
          onClick={() => {
            markAllRead();
            toastSuccess("All notifications marked read");
          }}
        >
          <CheckIcon />
          Mark all read
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="Notification type"
        className="mt-4 flex gap-5 overflow-x-auto border-b border-hairline text-sm hide-scrollbar"
      >
        {tabs.map(({ id, label }) => {
          const count = id === "all" ? items.length : counts[id];

          // Approvals only appear where something asks for one.
          if (id === "approval" && count === 0) return null;
          const active = tab === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px border-b-2 py-2.5 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-ink-2 hover:text-ink",
              )}
            >
              {label}
              <span className="ml-1.5 font-mono text-xs text-ink-3">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3.5 mb-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={unreadOnly}
          onClick={() => setUnreadOnly((value) => !value)}
          className="flex h-8 items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 text-xs outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative h-4 w-7 rounded-full transition-colors",
              unreadOnly ? "bg-ink" : "bg-line-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-3 rounded-full bg-canvas transition-[left] duration-200",
                unreadOnly ? "left-3.5" : "left-0.5",
              )}
            />
          </span>
          Unread only
        </button>
        <span className="font-mono text-xs text-ink-3">
          {state === "ready"
            ? unreadOnly || tab !== "all"
              ? `${visible.length} shown`
              : unreadCount === 0
                ? "0 unread"
                : `${visible.length} shown`
            : ""}
        </span>
      </div>

      {state === "loading" ? (
        <div
          aria-busy="true"
          aria-label="Loading notifications"
          className="mt-2 flex max-w-[960px] flex-col gap-1"
        >
          {[52, 40, 60, 34, 48, 38, 56].map((width, index) => (
            <div key={index} className="flex h-16 items-center gap-3 px-3">
              <Skeleton className="size-7 rounded-full" />
              <span className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-2.5" style={{ width: `${width}%` }} />
                <Skeleton className="h-2 w-[22%]" />
              </span>
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        <ErrorState
          className="mt-3"
          title="We couldn’t load your notifications."
          message="The server didn’t answer in time. New notifications still arrive in the bell. Try again in a moment."
          onRetry={onRetry ?? reload}
        />
      ) : null}

      {state === "ready" && items.length === 0 ? (
        <EmptyState
          className="mt-3"
          title="You’re all caught up."
          description="When someone mentions you, assigns you a task, comments on your work or asks for approval, it shows up here."
        />
      ) : null}

      {state === "ready" && items.length > 0 && visible.length === 0 ? (
        <EmptyState
          className="mt-3"
          title="Nothing here."
          description="No notifications match this view."
        />
      ) : null}

      {state === "ready" && days.length > 0 ? (
        <div className="flex max-w-[960px] flex-col gap-3.5">
          {days.map((day) => (
            <section key={day.label} className="flex flex-col">
              <h2 className="eyebrow px-3 pt-2.5 pb-1.5">{day.label}</h2>
              {day.items.map((item) => (
                <div
                  key={item.id}
                  className="relative flex gap-3 rounded-xl border-t border-hairline/60 p-3 hover:bg-hover"
                >
                  <UnreadDot unread={item.unread} />
                  <ActorAvatar name={item.actor} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <NotificationSentence item={item} />
                    {item.quote ? (
                      <NotificationQuote>{item.quote}</NotificationQuote>
                    ) : null}
                    {item.kind === "approval" ? (
                      <ApprovalActions
                        onApprove={() => {
                          resolve(item.id);
                          toastSuccess("Approved");
                        }}
                        onDecline={() => {
                          resolve(item.id);
                          toastSuccess("Declined");
                        }}
                      />
                    ) : null}
                  </div>
                  <KindChip item={item} />
                  <span className="w-16 text-right font-mono text-xs whitespace-nowrap text-ink-3">
                    {clockTime(item.createdAt)}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
