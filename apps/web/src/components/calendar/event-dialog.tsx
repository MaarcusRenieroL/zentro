"use client";

import { useState } from "react";

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

import { addDays, fromInput, toInput } from "./dates";

export const colors = {
  blue: "border-line bg-tint-projects text-ink",
  green: "border-line bg-tint-teams text-ink",
  amber: "border-line bg-tint-sun text-ink",
  red: "border-line bg-danger-subtle text-ink",
  violet: "border-line bg-tint-lilac text-ink",
  gray: "border-line bg-tint-slate text-ink",
} as const;

export type EventColor = keyof typeof colors;

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string;
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  createdBy: string | null;
  canManage: boolean;
};

export type EventDraft = {
  id?: string;
  title: string;
  description: string | null;
  location: string | null;
  color: EventColor;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date;
};

type Props = {
  draft: EventDraft | null;
  readOnly: boolean;
  createdBy?: string | null;
  onClose: () => void;
  onSave: (draft: EventDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

export function EventDialog({
  draft,
  readOnly,
  createdBy,
  onClose,
  onSave,
  onDelete,
}: Props) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {draft ? (
          <EventForm
            key={draft.id ?? "new"}
            draft={draft}
            readOnly={readOnly}
            createdBy={createdBy}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EventForm({
  draft,
  readOnly,
  createdBy,
  onClose,
  onSave,
  onDelete,
}: Omit<Props, "draft"> & { draft: EventDraft }) {
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description ?? "");
  const [location, setLocation] = useState(draft.location ?? "");
  const [color, setColor] = useState<EventColor>(draft.color);
  const [allDay, setAllDay] = useState(draft.allDay);
  const [start, setStart] = useState(toInput(draft.startsAt, draft.allDay));
  const [end, setEnd] = useState(
    toInput(
      draft.allDay ? addDays(draft.endsAt, -1) : draft.endsAt,
      draft.allDay,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleAllDay(next: boolean) {
    setAllDay(next);
    const s = fromInput(start, allDay);
    const e = fromInput(end, allDay);
    if (next) {
      setStart(toInput(s, true));
      setEnd(toInput(e, true));
    } else {
      s.setHours(9, 0);
      e.setTime(s.getTime() + 36e5);
      setStart(toInput(s, false));
      setEnd(toInput(e, false));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const s = fromInput(start, allDay);
    const e = fromInput(end, allDay);

    if (!title.trim()) return setError("Give the event a title.");
    if (Number.isNaN(+s) || Number.isNaN(+e))
      return setError("Pick a start and end.");
    if (e < s) return setError("The event can't end before it starts.");

    setBusy(true);
    setError(null);
    try {
      await onSave({
        id: draft.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        color,
        allDay,
        startsAt: s,
        endsAt: allDay ? addDays(e, 1) : e,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the event.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>
          {readOnly ? "Event" : draft.id ? "Edit event" : "New event"}
        </DialogTitle>
        <DialogDescription>
          {createdBy
            ? `Added by ${createdBy}`
            : "Visible to everyone in the organization."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-title">Title</Label>
        <Input
          id="ev-title"
          autoFocus
          disabled={readOnly}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={readOnly}
          checked={allDay}
          onChange={(e) => toggleAllDay(e.target.checked)}
        />
        All day
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-start">Starts</Label>
          <Input
            id="ev-start"
            type={allDay ? "date" : "datetime-local"}
            disabled={readOnly}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-end">Ends</Label>
          <Input
            id="ev-end"
            type={allDay ? "date" : "datetime-local"}
            disabled={readOnly}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-location">Location</Label>
        <Input
          id="ev-location"
          disabled={readOnly}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-desc">Notes</Label>
        <Textarea
          id="ev-desc"
          rows={3}
          disabled={readOnly}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <fieldset className="flex items-center gap-2" disabled={readOnly}>
        <legend className="sr-only">Color</legend>
        {(Object.keys(colors) as EventColor[]).map((name) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={color === name}
            onClick={() => setColor(name)}
            className={`size-6 rounded-full border-2 border-line-strong ${colors[name]} ${
              color === name ? "ring-2 ring-offset-2 ring-ink" : ""
            }`}
          />
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        {draft.id && !readOnly && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onDelete(draft.id!);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Could not delete.",
                );
                setBusy(false);
              }
            }}
          >
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onClose}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {readOnly ? null : (
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}
