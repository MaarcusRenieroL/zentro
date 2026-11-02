"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { PageHeader } from "@zentro/ui/components/page-header";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";
import { Input } from "@zentro/ui/shadcn/input";
import { Label } from "@zentro/ui/shadcn/label";
import { toast, toastError } from "@zentro/ui/index";

import { messageOf, selectClass } from "../tickets/labels";
import { HrTabs } from "./hr-tabs";

type Leave = inferRouterOutputs<AppRouter>["hr"]["leaveList"];

const typeLabels: Record<string, string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
  parental: "Parental leave",
  other: "Other",
};

const statusTone: Record<string, string> = {
  pending: "bg-tint-sun text-ink",
  approved: "bg-tint-teams text-ink",
  rejected: "bg-danger-subtle text-danger-text",
  cancelled: "bg-sunken text-ink-2",
};

const range = (start: string, end: string) => {
  const format = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const a = format.format(new Date(`${start}T00:00:00Z`));

  return start === end
    ? a
    : `${a} – ${format.format(new Date(`${end}T00:00:00Z`))}`;
};

export function LeaveBoard() {
  const trpc = useTrpcClient();
  const [leave, setLeave] = useState<Leave | null>(null);
  const [failed, setFailed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLeave(await trpc.hr.leaveList.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
      await load();
    } catch (error) {
      toastError(failure, messageOf(error));
    }
  }

  const requestButton = leave?.canRequest ? (
    <Button onClick={() => setRequesting(true)}>
      <PlusIcon aria-hidden />
      Request time off
    </Button>
  ) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <PageHeader
        title="Time off"
        description={
          leave?.canManage
            ? "Requests from everyone. Pending ones wait for your decision."
            : "Your requests and how they were answered."
        }
        actions={requestButton}
      />
      <HrTabs />

      {failed ? (
        <EmptyState
          title="Time off did not load"
          description="Check your connection and try again."
          action={<Button onClick={() => void load()}>Retry</Button>}
        />
      ) : leave === null ? (
        <p role="status" className="text-sm text-ink-2">
          Loading requests…
        </p>
      ) : leave.requests.length === 0 ? (
        <EmptyState
          title="No requests"
          description={
            leave.canRequest
              ? "Ask for time off and your manager will see it here."
              : "You need an employee record before you can request time off. Ask HR to add you."
          }
          action={requestButton}
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {leave.requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">
                  {request.employeeName}
                </p>
                <p className="text-sm text-ink-2">
                  {typeLabels[request.type]} ·{" "}
                  {range(request.startDate, request.endDate)} · {request.days}{" "}
                  {request.days === 1 ? "day" : "days"}
                </p>
                {request.note ? (
                  <p className="text-sm text-ink-3">{request.note}</p>
                ) : null}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusTone[request.status]}`}
              >
                {request.status}
              </span>
              {request.status === "pending" ? (
                <div className="flex gap-1">
                  {leave.canManage ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          void act(
                            () =>
                              trpc.hr.leaveDecide.mutate({
                                id: request.id,
                                decision: "approved",
                              }),
                            "Could not approve",
                          )
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void act(
                            () =>
                              trpc.hr.leaveDecide.mutate({
                                id: request.id,
                                decision: "rejected",
                              }),
                            "Could not reject",
                          )
                        }
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {request.mine ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void act(
                          () => trpc.hr.leaveCancel.mutate({ id: request.id }),
                          "Could not cancel",
                        )
                      }
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <RequestDialog
        open={requesting}
        onClose={() => setRequesting(false)}
        onSent={() => {
          setRequesting(false);
          toast.success("Request sent");
          void load();
        }}
      />
    </div>
  );
}

function RequestDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {open ? <RequestForm onClose={onClose} onSent={onSent} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const trpc = useTrpcClient();
  const [type, setType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!startDate || !endDate) return setError("Pick the first and last day.");

    setBusy(true);
    setError(null);
    try {
      await trpc.hr.leaveRequest.mutate({
        type: type as "annual",
        startDate,
        endDate,
        note: note.trim() || null,
      });
      onSent();
    } catch (err) {
      setError(messageOf(err) ?? "Could not send the request.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Request time off</DialogTitle>
        <DialogDescription>Weekends are not counted.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lv-type">Type</Label>
        <select
          id="lv-type"
          className={selectClass}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lv-start">First day</Label>
          <Input
            id="lv-start"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (!endDate || endDate < e.target.value)
                setEndDate(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lv-end">Last day</Label>
          <Input
            id="lv-end"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lv-note">Note (optional)</Label>
        <Input
          id="lv-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          Send request
        </Button>
      </DialogFooter>
    </form>
  );
}
