"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { PageHeader } from "@zentro/ui/components/page-header";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";

import {
  priorityLabels,
  priorityTone,
  statusLabels,
  statusTone,
} from "./labels";
import { NewTicketDialog } from "./new-ticket-dialog";

type Queue = inferRouterOutputs<AppRouter>["tickets"]["list"];
type View = "mine" | "unassigned" | "open" | "pending" | "resolved" | "spam";

const views: { id: View; label: string }[] = [
  { id: "mine", label: "My tickets" },
  { id: "unassigned", label: "Unassigned" },
  { id: "open", label: "All open" },
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
  { id: "spam", label: "Spam" },
];

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TicketQueue({ canCreate }: { canCreate: boolean }) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const [view, setView] = useState<View>("mine");
  const [q, setQ] = useState("");
  const [queue, setQueue] = useState<Queue | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setQueue(await trpc.tickets.list.query({ view, q: q || undefined }));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc, view, q]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), q ? 250 : 0);

    return () => clearTimeout(timer);
  }, [load, q]);

  const newButton = canCreate ? (
    <Button onClick={() => setCreating(true)}>
      <PlusIcon aria-hidden />
      New ticket
    </Button>
  ) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <PageHeader
        title="Tickets"
        description="Support requests, from first message to the task that fixes them."
        actions={newButton}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Ticket views"
          className="flex flex-wrap gap-1"
        >
          {views.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === item.id
                  ? "bg-sunken font-medium text-ink"
                  : "text-ink-2 hover:bg-sunken"
              }`}
            >
              {item.label}
              {queue ? (
                <span className="ml-1.5 font-mono text-xs text-ink-3">
                  {queue.counts[item.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-ink-3"
          />
          <Input
            aria-label="Search tickets"
            placeholder="Search tickets"
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {failed ? (
        <EmptyState
          title="Tickets did not load"
          description="Check your connection and try again."
          action={<Button onClick={() => void load()}>Retry</Button>}
        />
      ) : queue === null ? (
        <p role="status" className="text-sm text-ink-2">
          Loading tickets…
        </p>
      ) : queue.tickets.length === 0 ? (
        <EmptyState
          title={q ? "Nothing matches" : "All caught up"}
          description={
            q ? "Try a different search." : "No tickets in this view right now."
          }
          action={view === "mine" ? newButton : undefined}
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {queue.tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/tickets/${ticket.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-16 shrink-0 font-mono text-xs text-ink-3">
                  {ticket.ref}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">
                  {ticket.subject}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${statusTone[ticket.status]}`}
                >
                  {statusLabels[ticket.status]}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${priorityTone[ticket.priority]}`}
                >
                  {priorityLabels[ticket.priority]}
                </span>
                <span className="w-32 truncate text-sm text-ink-2">
                  {ticket.requesterName}
                </span>
                <span className="w-28 truncate text-sm text-ink-3">
                  {ticket.assignee ?? "Unassigned"}
                </span>
                <span className="w-32 text-right text-xs text-ink-3">
                  {dateFormat.format(new Date(ticket.updatedAt))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NewTicketDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => router.push(`/tickets/${id}`)}
      />
    </div>
  );
}
