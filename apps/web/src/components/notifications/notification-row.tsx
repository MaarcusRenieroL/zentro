"use client";

import type { ReactNode } from "react";

import { Button } from "@zentro/ui/shadcn/button";

import { ActorAvatar } from "~/src/components/actor-avatar";

import { kindLabels, type NotificationItem } from "./notifications";

export { ActorAvatar };

export function UnreadDot({ unread }: { unread: boolean }) {
  return unread ? (
    <span
      role="img"
      aria-label="Unread"
      className="mt-[11px] size-[7px] shrink-0 rounded-full bg-ink"
    />
  ) : (
    <span aria-hidden="true" className="w-[7px] shrink-0" />
  );
}

/** "Arjun mentioned you in ZEN-18 Fix login…" with keys set in mono. */
export function NotificationSentence({ item }: { item: NotificationItem }) {
  return (
    <span className="text-sm leading-5">
      <span className="font-medium">{item.actor}</span>{" "}
      <span className="text-ink-2">{item.verb}</span>{" "}
      <span
        className={item.objectIsKey ? "font-mono text-[13px]" : "font-medium"}
      >
        {item.object}
      </span>
      {item.title ? <> {item.title}</> : null}
    </span>
  );
}

export function NotificationQuote({ children }: { children: ReactNode }) {
  return (
    <span className="border-l-2 border-hairline pl-2.5 text-sm leading-5 text-ink-2">
      {children}
    </span>
  );
}

/** Approve is outlined and Decline is a ghost. Neither is ever violet. */
export function ApprovalActions({
  onApprove,
  onDecline,
}: {
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mt-1 flex gap-1.5">
      <Button variant="outline" size="sm" onClick={onApprove}>
        Approve
      </Button>
      <Button variant="ghost" size="sm" onClick={onDecline}>
        Decline
      </Button>
    </div>
  );
}

export function KindChip({ item }: { item: NotificationItem }) {
  return (
    <span className="mt-px self-start rounded-sm border border-hairline px-[7px] py-px font-mono text-[11px] whitespace-nowrap text-ink-2">
      {item.chip ?? kindLabels[item.kind]}
    </span>
  );
}
