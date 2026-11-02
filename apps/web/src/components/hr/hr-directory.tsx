"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { PageHeader } from "@zentro/ui/components/page-header";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { toast } from "@zentro/ui/index";

import { selectClass } from "../tickets/labels";
import {
  EmployeeDialog,
  employeeStatusLabels,
  type Person,
} from "./employee-dialog";
import { HrTabs } from "./hr-tabs";

type Directory = inferRouterOutputs<AppRouter>["hr"]["directory"];

export function HrDirectory() {
  const trpc = useTrpcClient();
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [target, setTarget] = useState<Person | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      setDirectory(await trpc.hr.directory.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const departments = useMemo(
    () =>
      [
        ...new Set(
          (directory?.people ?? []).flatMap((p) =>
            p.department ? [p.department] : [],
          ),
        ),
      ].sort(),
    [directory],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return (directory?.people ?? []).filter(
      (p) =>
        (!department || p.department === department) &&
        (!needle ||
          [p.name, p.jobTitle, p.department, p.location]
            .join(" ")
            .toLowerCase()
            .includes(needle)),
    );
  }, [directory, q, department]);

  const addButton = directory?.canManage ? (
    <Button onClick={() => setTarget("new")}>
      <PlusIcon aria-hidden />
      Add person
    </Button>
  ) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <PageHeader
        title="People"
        description="Everyone in the organization, who they report to and where they are."
        actions={addButton}
      />
      <HrTabs />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-ink-3"
          />
          <Input
            aria-label="Search people"
            placeholder="Search people"
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label="Department"
          className={selectClass}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {directory ? (
          <span className="ml-auto text-sm text-ink-3">
            {shown.length} of {directory.people.length}
          </span>
        ) : null}
      </div>

      {failed ? (
        <EmptyState
          title="People did not load"
          description="Check your connection and try again."
          action={<Button onClick={() => void load()}>Retry</Button>}
        />
      ) : directory === null ? (
        <p role="status" className="text-sm text-ink-2">
          Loading people…
        </p>
      ) : directory.people.length === 0 ? (
        <EmptyState
          title="No one here yet"
          description="Add the first employee record."
          action={addButton}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try a different search."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((person) => {
            const card = (
              <>
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">
                    {person.name}
                  </span>
                  {person.status !== "active" ? (
                    <span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-ink-2">
                      {employeeStatusLabels[person.status]}
                    </span>
                  ) : null}
                </span>
                <span className="truncate text-sm text-ink-2">
                  {person.jobTitle || "No title"}
                  {person.department ? ` · ${person.department}` : ""}
                </span>
                <span className="truncate text-xs text-ink-3">
                  {[
                    person.location,
                    person.managerName
                      ? `Reports to ${person.managerName}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </>
            );

            return (
              <li key={person.id}>
                {directory.canManage ? (
                  <button
                    type="button"
                    aria-label={`Edit ${person.name}`}
                    onClick={() => setTarget(person)}
                    className="flex w-full flex-col gap-1 rounded-xl border border-line p-4 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {card}
                  </button>
                ) : (
                  <div className="flex flex-col gap-1 rounded-xl border border-line p-4">
                    {card}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <EmployeeDialog
        target={target}
        people={directory?.people ?? []}
        onClose={() => setTarget(null)}
        onSaved={() => {
          setTarget(null);
          toast.success("Saved");
          void load();
        }}
      />
    </div>
  );
}
