"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import { toastSuccess } from "@zentro/ui/lib/toast";

import { paths } from "~/src/lib/paths";

import {
  ActorAvatar,
  ApprovalActions,
  NotificationQuote,
  NotificationSentence,
  UnreadDot,
} from "./notification-row";
import { kindGroups, relativeTime } from "./notifications";
import { useNotifications } from "./notifications-provider";

/** The bell: a 400px popover of unread-first groups. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { items, unreadCount, markAllRead, resolve } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative size-8">
          <BellIcon />
          {unreadCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-ink"
            />
          ) : null}
          <span className="sr-only">
            {unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(25rem,calc(100vw-1.5rem))] gap-0 rounded-2xl p-0 shadow-xl"
        side="bottom"
        align="end"
      >
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unreadCount > 0 ? (
            <span className="rounded-full border border-hairline px-2 py-px font-mono text-[11px] text-ink-2">
              {unreadCount} unread
            </span>
          ) : null}
          <div className="flex-1" />
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-sm text-xs text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="font-serif-italic text-3xl leading-none">
              You’re all caught up.
            </p>
            <p className="max-w-64 text-sm text-ink-2">
              Mentions, assignments, comments and approvals show up here.
            </p>
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto py-1">
            {kindGroups.map(({ kind, label }) => {
              const group = items.filter((item) => item.kind === kind);

              if (group.length === 0) return null;

              return (
                <section key={kind} aria-label={label}>
                  <h3 className="eyebrow px-4 pt-3 pb-1.5">{label}</h3>
                  {group.map((item) => (
                    <div
                      key={item.id}
                      className="relative flex gap-2.5 rounded-xl px-3 py-2.5 hover:bg-hover"
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
                      <span className="font-mono text-xs whitespace-nowrap text-ink-3">
                        {relativeTime(item.createdAt)}
                      </span>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 text-xs">
          <Link
            href={paths.inbox()}
            onClick={() => setOpen(false)}
            className="rounded-sm font-medium text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Open inbox
          </Link>
          <Link
            href={paths.settings()}
            onClick={() => setOpen(false)}
            className="rounded-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Notification settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
