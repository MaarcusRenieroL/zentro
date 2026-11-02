"use client";

import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
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

import { messageOf, selectClass } from "../tickets/labels";

export type Person =
  inferRouterOutputs<AppRouter>["hr"]["directory"]["people"][number];
type Linkable = inferRouterOutputs<AppRouter>["hr"]["unlinkedMembers"];

export const employeeStatusLabels: Record<string, string> = {
  active: "Active",
  on_leave: "On leave",
  leaving: "Leaving",
  former: "Former",
};

type Props = {
  /** `null` is closed, `"new"` adds someone, a person edits them. */
  target: Person | "new" | null;
  people: Person[];
  onClose: () => void;
  onSaved: () => void;
};

export function EmployeeDialog({ target, people, onClose, onSaved }: Props) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target ? (
          <Form
            key={target === "new" ? "new" : target.id}
            person={target === "new" ? null : target}
            people={people}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Form({
  person,
  people,
  onClose,
  onSaved,
}: {
  person: Person | null;
  people: Person[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const trpc = useTrpcClient();
  const [name, setName] = useState(person?.name ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [jobTitle, setJobTitle] = useState(person?.jobTitle ?? "");
  const [department, setDepartment] = useState(person?.department ?? "");
  const [location, setLocation] = useState(person?.location ?? "");
  const [status, setStatus] = useState(person?.status ?? "active");
  const [startDate, setStartDate] = useState(person?.startDate ?? "");
  const [endDate, setEndDate] = useState(person?.endDate ?? "");
  const [managerId, setManagerId] = useState(person?.managerId ?? "");
  const [memberId, setMemberId] = useState(person?.memberId ?? "");
  const [linkable, setLinkable] = useState<Linkable>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void trpc.hr.unlinkedMembers.query().then(setLinkable, () => undefined);
  }, [trpc]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const data = {
      name,
      email: email.trim() || null,
      jobTitle,
      department: department.trim() || null,
      location: location.trim() || null,
      status: status as "active",
      startDate: startDate || null,
      endDate: endDate || null,
      managerId: managerId || null,
      memberId: memberId || null,
    };

    try {
      if (person) await trpc.hr.update.mutate({ id: person.id, data });
      else await trpc.hr.create.mutate(data);
      onSaved();
    } catch (err) {
      setError(messageOf(err) ?? "Could not save.");
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !person ||
      !window.confirm(`Remove ${person.name}? Their time off goes too.`)
    )
      return;

    setBusy(true);
    try {
      await trpc.hr.remove.mutate({ id: person.id });
      onSaved();
    } catch (err) {
      setError(messageOf(err) ?? "Could not remove.");
      setBusy(false);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    set: (value: string) => void,
    type = "text",
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{person ? "Edit person" : "Add person"}</DialogTitle>
        <DialogDescription>
          Employee records are visible to everyone who can open the directory.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        {field("emp-name", "Name", name, setName)}
        {field("emp-email", "Email", email, setEmail, "email")}
        {field("emp-title", "Job title", jobTitle, setJobTitle)}
        {field("emp-dept", "Department", department, setDepartment)}
        {field("emp-loc", "Location", location, setLocation)}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="emp-status">Status</Label>
          <select
            id="emp-status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(employeeStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {field("emp-start", "Start date", startDate, setStartDate, "date")}
        {field("emp-end", "Last day", endDate, setEndDate, "date")}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="emp-manager">Reports to</Label>
          <select
            id="emp-manager"
            className={selectClass}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">No one</option>
            {people
              .filter((other) => other.id !== person?.id)
              .map((other) => (
                <option key={other.id} value={other.id}>
                  {other.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="emp-member">Sign-in account</Label>
          <select
            id="emp-member"
            className={selectClass}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            <option value="">Not linked</option>
            {person?.memberId &&
            !linkable.some((m) => m.id === person.memberId) ? (
              <option value={person.memberId}>Current account</option>
            ) : null}
            {linkable.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        {person ? (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto"
            disabled={busy}
            onClick={() => void remove()}
          >
            Remove
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
