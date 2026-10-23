"use client";

import { useMemo, useState } from "react";
import { XIcon } from "lucide-react";

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

export type Person = { id: string; name: string; email: string; isMe: boolean };

export type ComposeDraft = {
  id?: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  replyToId?: string;
};

type Props = {
  draft: ComposeDraft | null;
  people: Person[];
  onSend: (draft: ComposeDraft) => Promise<void>;
  /** Called when the window closes with something typed in it. */
  onKeep: (draft: ComposeDraft) => Promise<void>;
  onDiscard: () => void;
};

function Recipients({
  label,
  value,
  people,
  onChange,
}: {
  label: string;
  value: string[];
  people: Person[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter(
        (person) =>
          !value.includes(person.id) &&
          (person.name.toLowerCase().includes(q) ||
            person.email.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [people, query, value]);

  const add = (id: string) => {
    onChange([...value, id]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`mail-${label}`}>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line px-2 py-1.5">
        {value.map((id) => {
          const person = people.find((item) => item.id === id);
          return (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs"
            >
              {person?.name ?? "Someone"}
              <button
                type="button"
                aria-label={`Remove ${person?.name ?? "recipient"}`}
                onClick={() => onChange(value.filter((item) => item !== id))}
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </span>
          );
        })}
        <input
          id={`mail-${label}`}
          value={query}
          autoComplete="off"
          placeholder={value.length ? "" : "Search people"}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && matches[0]) {
              event.preventDefault();
              add(matches[0].id);
            }
            if (event.key === "Backspace" && !query && value.length)
              onChange(value.slice(0, -1));
          }}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {matches.length ? (
        <ul className="rounded-md border border-line bg-canvas p-1 shadow-sm">
          {matches.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => add(person.id)}
                className="flex w-full flex-col rounded px-2 py-1 text-left text-sm hover:bg-sunken"
              >
                <span>{person.name}</span>
                <span className="text-xs text-ink-3">{person.email}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ComposeDialog(props: Props) {
  const { draft } = props;

  // Only the buttons close it, so nothing typed is lost by a stray click.
  return (
    <Dialog open={draft !== null}>
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        {draft ? (
          <ComposeForm key={draft.id ?? "new"} {...props} draft={draft} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ComposeForm({
  draft,
  people,
  onSend,
  onKeep,
  onDiscard,
}: Props & { draft: ComposeDraft }) {
  const [to, setTo] = useState(draft.to);
  const [cc, setCc] = useState(draft.cc);
  const [showCc, setShowCc] = useState(draft.cc.length > 0);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = (): ComposeDraft => ({
    id: draft.id,
    replyToId: draft.replyToId,
    to,
    cc,
    subject,
    body,
  });
  const hasContent = Boolean(
    to.length || cc.length || subject.trim() || body.trim(),
  );

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSend(current());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
      setBusy(false);
    }
  }

  async function close() {
    setBusy(true);
    try {
      if (hasContent) await onKeep(current());
      else onDiscard();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the draft.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-3">
      <DialogHeader>
        <DialogTitle>{draft.replyToId ? "Reply" : "New message"}</DialogTitle>
        <DialogDescription>
          Only the people you add can read this message.
        </DialogDescription>
      </DialogHeader>

      <Recipients label="To" value={to} people={people} onChange={setTo} />
      {showCc ? (
        <Recipients label="Cc" value={cc} people={people} onChange={setCc} />
      ) : (
        <button
          type="button"
          className="self-start text-xs text-ink-2 underline"
          onClick={() => setShowCc(true)}
        >
          Add Cc
        </button>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-subject">Subject</Label>
        <Input
          id="mail-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-body">Message</Label>
        <Textarea
          id="mail-body"
          rows={10}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          className="mr-auto"
          disabled={busy}
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void close()}
        >
          {hasContent ? "Save draft" : "Close"}
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send"}
        </Button>
      </DialogFooter>
    </form>
  );
}
