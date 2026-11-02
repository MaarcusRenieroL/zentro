"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

import { messageOf } from "../tickets/labels";
import { formatMoney, formatPeriod, runTone } from "./money";

type Runs = inferRouterOutputs<AppRouter>["payroll"]["runs"];
type Salaries = inferRouterOutputs<AppRouter>["payroll"]["salaries"];
type Mine = inferRouterOutputs<AppRouter>["payroll"]["mine"];
type Tab = "runs" | "salaries" | "mine";

export function PayrollHome({
  canViewAll,
  canViewOwn,
}: {
  canViewAll: boolean;
  canViewOwn: boolean;
}) {
  const [tab, setTab] = useState<Tab>(canViewAll ? "runs" : "mine");
  const tabs: { id: Tab; label: string }[] = [
    ...(canViewAll
      ? [
          { id: "runs" as const, label: "Pay runs" },
          { id: "salaries" as const, label: "Salaries" },
        ]
      : []),
    ...(canViewOwn ? [{ id: "mine" as const, label: "My payslips" }] : []),
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <PageHeader
        title="Payroll"
        description="Pay runs built from employee records, approved before anyone is paid."
      />
      <div role="tablist" aria-label="Payroll sections" className="flex gap-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab === item.id
                ? "bg-sunken font-medium text-ink"
                : "text-ink-2 hover:bg-sunken"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "runs" ? <RunsTab /> : null}
      {tab === "salaries" ? <SalariesTab /> : null}
      {tab === "mine" ? <MineTab /> : null}
    </div>
  );
}

function RunsTab() {
  const trpc = useTrpcClient();
  const router = useRouter();
  const [runs, setRuns] = useState<Runs | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setRuns(await trpc.payroll.runs.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const button = runs?.canManage ? (
    <Button onClick={() => setCreating(true)}>
      <PlusIcon aria-hidden />
      New pay run
    </Button>
  ) : null;

  if (failed)
    return (
      <EmptyState
        title="Pay runs did not load"
        description="Check your connection and try again."
        action={<Button onClick={() => void load()}>Retry</Button>}
      />
    );

  if (!runs)
    return (
      <p role="status" className="text-sm text-ink-2">
        Loading pay runs…
      </p>
    );

  return (
    <>
      {button ? <div className="flex justify-end">{button}</div> : null}
      {runs.runs.length === 0 ? (
        <EmptyState
          title="No pay runs yet"
          description="Set salaries first, then start a run for a period."
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {runs.runs.map((run) => (
            <li key={run.id}>
              <Link
                href={`/payroll/${run.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {run.label}
                  </span>
                  <span className="text-sm text-ink-2">
                    {formatPeriod(run.periodStart, run.periodEnd)} ·{" "}
                    {run.people} {run.people === 1 ? "person" : "people"}
                  </span>
                </span>
                <span className="font-mono text-sm text-ink">
                  {formatMoney(run.net)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${runTone[run.status]}`}
                >
                  {run.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NewRunDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => router.push(`/payroll/${id}`)}
      />
    </>
  );
}

function NewRunDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {open ? <RunForm onClose={onClose} onCreated={onCreated} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RunForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const trpc = useTrpcClient();
  const [label, setLabel] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [rate, setRate] = useState("20");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!periodStart || !periodEnd) return setError("Pick the period.");

    setBusy(true);
    setError(null);
    try {
      const { id } = await trpc.payroll.createRun.mutate({
        label,
        periodStart,
        periodEnd,
        deductionRateBps: Math.round(Number(rate) * 100),
      });
      onCreated(id);
    } catch (err) {
      setError(messageOf(err) ?? "Could not create the pay run.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>New pay run</DialogTitle>
        <DialogDescription>
          Each paid employee gets a line worth one twelfth of their salary.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="run-label">Name</Label>
        <Input
          id="run-label"
          autoFocus
          placeholder="November 2026"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="run-start">Period start</Label>
          <Input
            id="run-start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="run-end">Period end</Label>
          <Input
            id="run-end"
            type="date"
            min={periodStart || undefined}
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="run-rate">Tax and contributions (%)</Label>
        <Input
          id="run-rate"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
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
          Create draft
        </Button>
      </DialogFooter>
    </form>
  );
}

function SalariesTab() {
  const trpc = useTrpcClient();
  const [data, setData] = useState<Salaries | null>(null);
  const [failed, setFailed] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setData(await trpc.payroll.salaries.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(person: Salaries["people"][number]) {
    const value = Number(drafts[person.id]);

    if (!Number.isFinite(value) || value < 0) {
      return toastError("Enter a salary", "Use a number such as 60000.");
    }

    try {
      await trpc.payroll.setSalary.mutate({
        employeeId: person.id,
        annualSalary: Math.round(value * 100),
        currency: person.currency ?? "USD",
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[person.id];
        return next;
      });
      toast.success("Salary saved");
      await load();
    } catch (error) {
      toastError("Could not save the salary", messageOf(error));
    }
  }

  if (failed)
    return (
      <EmptyState
        title="Salaries did not load"
        description="Check your connection and try again."
        action={<Button onClick={() => void load()}>Retry</Button>}
      />
    );

  if (!data)
    return (
      <p role="status" className="text-sm text-ink-2">
        Loading salaries…
      </p>
    );

  if (!data.people.length)
    return (
      <EmptyState
        title="No employees yet"
        description="Add people in HR, then set what they are paid here."
      />
    );

  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {data.people.map((person) => {
        const draft = drafts[person.id];

        return (
          <li
            key={person.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{person.name}</p>
              <p className="text-sm text-ink-2">
                {person.jobTitle || "No title"}
              </p>
            </div>
            {data.canManage ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save(person);
                }}
              >
                <Input
                  aria-label={`Annual salary for ${person.name}`}
                  inputMode="decimal"
                  className="w-32"
                  placeholder="Not set"
                  value={
                    draft ??
                    (person.annualSalary !== null
                      ? String(person.annualSalary / 100)
                      : "")
                  }
                  onChange={(e) =>
                    setDrafts((current) => ({
                      ...current,
                      [person.id]: e.target.value,
                    }))
                  }
                />
                <span className="w-10 text-xs text-ink-3">
                  {person.currency ?? "USD"}
                </span>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={draft === undefined}
                >
                  Save
                </Button>
              </form>
            ) : (
              <span className="font-mono text-sm text-ink">
                {person.annualSalary !== null
                  ? formatMoney(person.annualSalary, person.currency ?? "USD")
                  : "Not set"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MineTab() {
  const trpc = useTrpcClient();
  const [slips, setSlips] = useState<Mine | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    trpc.payroll.mine.query().then(setSlips, () => setFailed(true));
  }, [trpc]);

  if (failed)
    return (
      <EmptyState
        title="Payslips did not load"
        description="Check your connection and try again."
      />
    );

  if (!slips)
    return (
      <p role="status" className="text-sm text-ink-2">
        Loading payslips…
      </p>
    );

  if (!slips.length)
    return (
      <EmptyState
        title="No payslips yet"
        description="Your payslips appear here once a pay run that includes you is approved."
      />
    );

  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {slips.map((slip) => (
        <li
          key={slip.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{slip.label}</p>
            <p className="text-sm text-ink-2">
              {formatPeriod(slip.periodStart, slip.periodEnd)} · gross{" "}
              {formatMoney(slip.base + slip.bonus, slip.currency)} · deductions{" "}
              {formatMoney(slip.deductions, slip.currency)}
            </p>
          </div>
          <span className="font-mono text-sm text-ink">
            {formatMoney(slip.net, slip.currency)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs capitalize ${runTone[slip.status]}`}
          >
            {slip.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
