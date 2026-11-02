"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { PageHeader } from "@zentro/ui/components/page-header";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { toast, toastError } from "@zentro/ui/index";

import { usePageCrumb } from "~/src/components/shell/breadcrumb-context";

import { messageOf, priorityLabels, selectClass, statusLabels } from "./labels";

type Ticket = inferRouterOutputs<AppRouter>["tickets"]["get"];
type People = inferRouterOutputs<AppRouter>["tickets"]["assignees"];

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TicketDetail({ id }: { id: string }) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [people, setPeople] = useState<People>([]);
  const [failed, setFailed] = useState(false);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"reply" | "note">("reply");
  const [taskKey, setTaskKey] = useState("");
  const [busy, setBusy] = useState(false);

  usePageCrumb(`/tickets/${id}`, ticket?.ref ?? "Ticket");

  const load = useCallback(async () => {
    try {
      const [next, assignees] = await Promise.all([
        trpc.tickets.get.query({ id }),
        trpc.tickets.assignees.query(),
      ]);
      setTicket(next);
      setPeople(assignees);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, failure: string) {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (error) {
      toastError(failure, messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  if (failed) {
    return (
      <div className="p-6">
        <EmptyState
          title="Ticket not found"
          description="It may have been deleted."
          action={
            <Button asChild>
              <Link href="/tickets">Back to tickets</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!ticket) {
    return (
      <p role="status" className="p-6 text-sm text-ink-2">
        Loading ticket…
      </p>
    );
  }

  const update = (
    changes: Partial<{
      status: "open" | "pending" | "resolved" | "spam";
      priority: "low" | "normal" | "high" | "urgent";
      assigneeMemberId: string | null;
    }>,
  ) =>
    run(
      () => trpc.tickets.update.mutate({ id: ticket.id, ...changes }),
      "Could not update the ticket",
    );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <PageHeader
        breadcrumbs={
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1 text-sm text-ink-2 hover:underline"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden />
            Tickets
          </Link>
        }
        title={ticket.subject}
        meta={
          <span className="font-mono text-sm text-ink-3">{ticket.ref}</span>
        }
        description={`${ticket.requesterName}${ticket.requesterEmail ? ` · ${ticket.requesterEmail}` : ""} · opened ${dateFormat.format(new Date(ticket.createdAt))}`}
        actions={
          ticket.canDelete ? (
            <Button
              variant="ghost"
              onClick={async () => {
                if (
                  !window.confirm(
                    `Delete ${ticket.ref}? This cannot be undone.`,
                  )
                )
                  return;
                try {
                  await trpc.tickets.remove.mutate({ id: ticket.id });
                  toast.success("Ticket deleted");
                  router.push("/tickets");
                } catch (error) {
                  toastError("Could not delete the ticket", messageOf(error));
                }
              }}
            >
              <Trash2Icon aria-hidden />
              Delete
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {ticket.description ? (
            <section
              aria-label="Original request"
              className="rounded-xl border border-line p-4 text-sm whitespace-pre-wrap text-ink"
            >
              {ticket.description}
            </section>
          ) : null}

          <ol className="flex flex-col gap-3">
            {ticket.messages.map((message) => (
              <li
                key={message.id}
                className={`rounded-xl border p-4 ${
                  message.kind === "note"
                    ? "border-dashed border-line-strong bg-tint-sun"
                    : "border-line"
                }`}
              >
                <p className="mb-1 text-xs text-ink-2">
                  <span className="font-medium text-ink">{message.author}</span>
                  {message.kind === "note"
                    ? " · internal note"
                    : " · reply"} ·{" "}
                  {dateFormat.format(new Date(message.createdAt))}
                </p>
                <p className="text-sm whitespace-pre-wrap text-ink">
                  {message.body}
                </p>
              </li>
            ))}
          </ol>

          {ticket.canReply ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await trpc.tickets.reply.mutate({
                    id: ticket.id,
                    kind,
                    body,
                  });
                  setBody("");
                }, "Could not send");
              }}
            >
              <div
                role="radiogroup"
                aria-label="Reply type"
                className="flex gap-1"
              >
                {(["reply", "note"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={kind === value}
                    onClick={() => setKind(value)}
                    className={`rounded-lg px-3 py-1 text-sm ${
                      kind === value
                        ? "bg-sunken font-medium text-ink"
                        : "text-ink-2 hover:bg-sunken"
                    }`}
                  >
                    {value === "reply" ? "Reply" : "Internal note"}
                  </button>
                ))}
              </div>
              <Textarea
                aria-label={kind === "reply" ? "Reply" : "Internal note"}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  kind === "reply"
                    ? "Write to the requester"
                    : "Only your team sees this"
                }
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={busy || !body.trim()}>
                  {kind === "reply" ? "Send reply" : "Add note"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 text-sm">
          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2">Status</span>
            <select
              className={selectClass}
              disabled={!ticket.canUpdate || busy}
              value={ticket.status}
              onChange={(e) =>
                void update({ status: e.target.value as "open" })
              }
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2">Priority</span>
            <select
              className={selectClass}
              disabled={!ticket.canUpdate || busy}
              value={ticket.priority}
              onChange={(e) =>
                void update({ priority: e.target.value as "normal" })
              }
            >
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2">Assignee</span>
            <select
              className={selectClass}
              disabled={!ticket.canUpdate || busy}
              value={ticket.assigneeMemberId ?? ""}
              onChange={(e) =>
                void update({ assigneeMemberId: e.target.value || null })
              }
            >
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-ink-2">Linked task</span>
            {ticket.linkedTask ? (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-ink">
                  <span className="font-mono text-xs">
                    {ticket.linkedTask.key}
                  </span>{" "}
                  {ticket.linkedTask.name}
                </span>
                {ticket.canUpdate ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          trpc.tickets.linkTask.mutate({
                            id: ticket.id,
                            taskKey: null,
                          }),
                        "Could not unlink the task",
                      )
                    }
                  >
                    Unlink
                  </Button>
                ) : null}
              </div>
            ) : ticket.canUpdate ? (
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    await trpc.tickets.linkTask.mutate({
                      id: ticket.id,
                      taskKey: taskKey.trim(),
                    });
                    setTaskKey("");
                  }, "Could not link the task");
                }}
              >
                <Input
                  aria-label="Task key"
                  placeholder="ZEN-61"
                  value={taskKey}
                  onChange={(e) => setTaskKey(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={busy || !taskKey.trim()}
                >
                  Link
                </Button>
              </form>
            ) : (
              <span className="text-ink-3">None</span>
            )}
          </div>

          {ticket.category ? (
            <p className="text-ink-2">
              Category: <span className="text-ink">{ticket.category}</span>
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
