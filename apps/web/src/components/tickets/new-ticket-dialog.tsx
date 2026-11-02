"use client";

import { useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
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
import { Textarea } from "@zentro/ui/shadcn/textarea";

import { messageOf, priorityLabels, selectClass } from "./labels";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function NewTicketDialog({ open, onClose, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {open ? <Form onCreated={onCreated} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Form({ onClose, onCreated }: Pick<Props, "onClose" | "onCreated">) {
  const trpc = useTrpcClient();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [priority, setPriority] =
    useState<keyof typeof priorityLabels>("normal");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const { id } = await trpc.tickets.create.mutate({
        subject,
        description,
        requesterName,
        requesterEmail: requesterEmail.trim() || null,
        priority: priority as "low" | "normal" | "high" | "urgent",
        category: category.trim() || null,
        assigneeMemberId: null,
      });
      onCreated(id);
    } catch (err) {
      setError(messageOf(err) ?? "Could not create the ticket.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>New ticket</DialogTitle>
        <DialogDescription>
          Log a request from a customer or a teammate.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tk-subject">Subject</Label>
        <Input
          id="tk-subject"
          autoFocus
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tk-name">Requester</Label>
          <Input
            id="tk-name"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tk-email">Email (optional)</Label>
          <Input
            id="tk-email"
            type="email"
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tk-priority">Priority</Label>
          <select
            id="tk-priority"
            className={selectClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tk-category">Category (optional)</Label>
          <Input
            id="tk-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tk-desc">What happened</Label>
        <Textarea
          id="tk-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          Create ticket
        </Button>
      </DialogFooter>
    </form>
  );
}
