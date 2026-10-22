"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BellOffIcon,
  HashIcon,
  LockIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
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
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { useChatSidebar } from "./chat-store";
import { useCustomEmoji } from "./custom-emoji";
import { MessageBody } from "./message-body";
import { Avatar, type MessageView } from "./message-item";

/** Pick a conversation to forward a message to, with an optional note. */
export function ForwardDialog({
  message,
  onClose,
}: {
  message: MessageView;
  onClose: () => void;
}) {
  const trpc = useTrpcClient();
  const { data } = useChatSidebar();
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const channels = useMemo(
    () =>
      (data?.channels ?? [])
        .filter((channel) => !channel.archived)
        .filter((channel) =>
          channel.title.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [data, query],
  );

  const forward = async (channelId: string, title: string) => {
    setSending(channelId);

    try {
      await trpc.chat.forward.mutate({
        messageId: message.id,
        channelId,
        note: note.trim(),
      });
      toastSuccess(`Forwarded to ${title}`);
      onClose();
    } catch (error) {
      toastError(error, "Could not forward the message");
      setSending(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Forward message</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {message.body.replace(/<@[0-9a-f-]{36}>/g, "@someone") ||
              "Attachment"}
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a channel or person…"
          aria-label="Find a conversation"
        />
        <ul
          className="flex max-h-56 flex-col gap-0.5 overflow-y-auto"
          aria-label="Conversations"
        >
          {channels.map((channel) => (
            <li key={channel.id}>
              <button
                type="button"
                disabled={sending !== null}
                onClick={() => void forward(channel.id, channel.title)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover disabled:opacity-60"
              >
                {channel.kind === "dm" ? (
                  <Avatar
                    name={channel.people[0]?.name ?? channel.title}
                    size={20}
                  />
                ) : channel.visibility === "private" ? (
                  <LockIcon className="size-4 text-ink-3" aria-hidden="true" />
                ) : (
                  <HashIcon className="size-4 text-ink-3" aria-hidden="true" />
                )}
                <span className="flex-1 truncate">{channel.title}</span>
                <span className="font-mono text-[11px] text-ink-3">
                  {sending === channel.id ? "Sending…" : "Forward"}
                </span>
              </button>
            </li>
          ))}
          {!channels.length ? (
            <li className="px-2 py-3 text-sm text-ink-3">
              No conversation matches.
            </li>
          ) : null}
        </ul>
        <Input
          value={note}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note (optional)"
          aria-label="Note"
        />
      </DialogContent>
    </Dialog>
  );
}

/** A short summary of a thread or the latest messages in a channel. */
export function SummaryDialog({
  channelId,
  parentId,
  title,
  onClose,
}: {
  channelId: string;
  parentId?: string;
  title: string;
  onClose: () => void;
}) {
  const trpc = useTrpcClient();
  const [result, setResult] = useState<{ summary: string; ai: boolean } | null>(
    null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;

    trpc.chat.summarize
      .mutate({ channelId, parentId })
      .then((data) => live && setResult(data))
      .catch(() => live && setFailed(true));

    return () => {
      live = false;
    };
  }, [trpc, channelId, parentId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <SparklesIcon className="size-5" aria-hidden="true" />
            Summary
          </DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        {failed ? (
          <p role="alert" className="text-sm text-danger-text">
            Could not summarize this right now. Try again in a moment.
          </p>
        ) : result ? (
          <>
            <div className="text-[15px] leading-6">
              <MessageBody
                body={result.summary
                  .split("\n")
                  .map((line) =>
                    /^\s*[•*]\s/.test(line)
                      ? line.replace(/^\s*[•*]/, "-")
                      : line,
                  )
                  .join("\n")}
                names={{}}
              />
            </div>
            <p className="font-mono text-[11px] text-ink-3">
              {result.ai
                ? "Written by Claude from the messages in view. Check anything important."
                : "A plain recap, not a written summary: set ANTHROPIC_API_KEY to get one."}
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A question with two to eight options. */
export function PollDialog({
  channelId,
  parentId,
  initialQuestion = "",
  initialOptions,
  onClose,
  onCreated,
}: {
  channelId: string;
  parentId?: string;
  initialQuestion?: string;
  initialOptions?: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const trpc = useTrpcClient();
  const [question, setQuestion] = useState(initialQuestion);
  const [options, setOptions] = useState(initialOptions ?? ["", ""]);
  const [multiple, setMultiple] = useState(false);
  const [saving, setSaving] = useState(false);
  const valid =
    question.trim() && options.filter((option) => option.trim()).length >= 2;

  const submit = async () => {
    if (!valid) return;

    setSaving(true);

    try {
      await trpc.chat.createPoll.mutate({
        channelId,
        parentId,
        question: question.trim(),
        options: options.map((option) => option.trim()).filter(Boolean),
        multiple,
      });
      onCreated();
      onClose();
    } catch (error) {
      toastError(error, "Could not create the poll");
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a poll</DialogTitle>
          <DialogDescription>
            Ask a question and let people vote. Results update live.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="poll-question" className="text-sm font-medium">
            Question
          </label>
          <Input
            id="poll-question"
            autoFocus
            value={question}
            maxLength={200}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Where should we have lunch?"
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Options</legend>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                maxLength={100}
                aria-label={`Option ${index + 1}`}
                onChange={(event) =>
                  setOptions((current) =>
                    current.map((entry, i) =>
                      i === index ? event.target.value : entry,
                    ),
                  )
                }
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove option ${index + 1}`}
                  onClick={() =>
                    setOptions((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2Icon className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {options.length < 8 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setOptions((current) => [...current, ""])}
            >
              <PlusIcon className="size-4" />
              Add option
            </Button>
          ) : null}
        </fieldset>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={multiple}
            onChange={(event) => setMultiple(event.target.checked)}
            className="size-4 accent-[var(--signal)]"
          />
          Allow picking more than one option
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || saving} onClick={() => void submit()}>
            {saving ? "Creating…" : "Create poll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const dndChoices: Array<[string, number]> = [
  ["30 minutes", 30],
  ["1 hour", 60],
  ["Until tomorrow 9:00", -1],
  ["1 week", 60 * 24 * 7],
];

const clearChoices: Array<[string, number | null]> = [
  ["Don’t clear", null],
  ["In 30 minutes", 30],
  ["In 1 hour", 60],
  ["Today", -1],
  ["In 1 week", 60 * 24 * 7],
];

/** Minutes from now until tomorrow at 9:00 (or end of today when `today`). */
function untilTomorrow(today = false) {
  const date = new Date();

  if (today) {
    date.setHours(23, 59, 0, 0);
  } else {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }

  return Math.max(1, Math.round((date.getTime() - Date.now()) / 60_000));
}

const statusPresets: Array<[string, string]> = [
  ["📅", "In a meeting"],
  ["🚌", "Commuting"],
  ["🤒", "Out sick"],
  ["🌴", "On leave"],
  ["🎯", "Focusing"],
];

/** Custom status and do not disturb. */
export function StatusDialog({ onClose }: { onClose: () => void }) {
  const trpc = useTrpcClient();
  const sidebar = useChatSidebar();
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState("");
  const [clear, setClear] = useState<number | null>(null);
  const [dnd, setDnd] = useState<number | null>(null);
  const [dndUntil, setDndUntil] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;

    trpc.chat.statusGet
      .query()
      .then((status) => {
        if (!live) return;

        setEmoji(status.emoji ?? "");
        setText(status.text ?? "");
        setDndUntil(status.dndUntil ? new Date(status.dndUntil) : null);
        setLoaded(true);
      })
      .catch(() => live && setLoaded(true));

    return () => {
      live = false;
    };
  }, [trpc]);

  const save = async (override?: {
    emoji?: string;
    text?: string;
    dndMinutes?: number | null;
  }) => {
    setSaving(true);

    try {
      const nextEmoji = override?.emoji ?? emoji;
      const nextText = override?.text ?? text;

      await trpc.chat.statusSet.mutate({
        emoji: nextEmoji.trim() || null,
        text: nextText.trim() || null,
        clearInMinutes:
          clear === null ? null : clear === -1 ? untilTomorrow(true) : clear,
        dndMinutes:
          override && "dndMinutes" in override
            ? (override.dndMinutes ?? 0)
            : dnd === null
              ? null
              : dnd === -1
                ? untilTomorrow()
                : dnd,
      });
      await sidebar.refresh();
      toastSuccess("Status saved");
      onClose();
    } catch (error) {
      toastError(error, "Could not save your status");
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Your status</DialogTitle>
          <DialogDescription>
            Shown next to your name in chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            value={emoji}
            maxLength={4}
            onChange={(event) => setEmoji(event.target.value)}
            aria-label="Status emoji"
            placeholder="🙂"
            className="w-14 text-center text-lg"
          />
          <Input
            value={text}
            maxLength={80}
            onChange={(event) => setText(event.target.value)}
            aria-label="Status text"
            placeholder="What’s your status?"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusPresets.map(([glyph, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setEmoji(glyph);
                setText(label);
              }}
              className="rounded-full border border-hairline px-2.5 py-1 text-[13px] hover:bg-hover"
            >
              {glyph} {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="w-28 text-ink-2">Clear status</span>
          <select
            value={clear === null ? "" : String(clear)}
            onChange={(event) =>
              setClear(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            className="h-9 flex-1 rounded-md border border-hairline bg-surface px-2"
          >
            {clearChoices.map(([label, value]) => (
              <option key={label} value={value === null ? "" : String(value)}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-hairline p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <BellOffIcon className="size-4" aria-hidden="true" />
            Do not disturb
          </p>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Pauses the chat badge. Messages still arrive and stay unread.
          </p>
          {dndUntil && dndUntil.getTime() > Date.now() ? (
            <div className="mt-2 flex items-center justify-between rounded-md bg-sunken px-2.5 py-1.5 text-sm">
              <span>
                On until{" "}
                {dndUntil.toLocaleString("en-US", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => void save({ dndMinutes: 0 })}
              >
                Turn off
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dndChoices.map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={dnd === value}
                  onClick={() => setDnd(dnd === value ? null : value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[13px] hover:bg-hover",
                    dnd === value
                      ? "border-signal bg-signal-subtle"
                      : "border-hairline",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => void save({ emoji: "", text: "" })}
          >
            Clear status
          </Button>
          <Button disabled={!loaded || saving} onClick={() => void save()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Upload, list and remove the organization's custom emoji. */
export function EmojiManagerDialog({
  onClose,
  canManage,
}: {
  onClose: () => void;
  canManage: boolean;
}) {
  const trpc = useTrpcClient();
  const custom = useCustomEmoji();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const add = async () => {
    if (!file) return;

    setSaving(true);

    try {
      const form = new FormData();

      form.append("file", file);

      const response = await fetch("/api/files", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Could not upload the image.");
      }

      await trpc.chat.emojiCreate.mutate({ name, fileId: data.id });
      custom.reload();
      setName("");
      setFile(null);

      if (input.current) input.current.value = "";

      toastSuccess(`:${name}: added`);
    } catch (error) {
      toastError(error, "Could not add the emoji");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (emojiName: string) => {
    try {
      await trpc.chat.emojiDelete.mutate({ name: emojiName });
      custom.reload();
    } catch (error) {
      toastError(error, "Could not remove the emoji");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Custom emoji</DialogTitle>
          <DialogDescription>
            Type :name: in a message or pick one from the emoji menu. Images up
            to 256 KB.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <label className="flex min-w-32 flex-1 flex-col gap-1 text-sm font-medium">
            Name
            <Input
              value={name}
              maxLength={32}
              onChange={(event) =>
                setName(
                  event.target.value.toLowerCase().replace(/[^a-z0-9_+-]/g, ""),
                )
              }
              placeholder="shipit"
            />
          </label>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            aria-label="Emoji image"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="max-w-48 text-sm"
          />
          <Button type="submit" disabled={saving || name.length < 2 || !file}>
            {saving ? "Adding…" : "Add"}
          </Button>
        </form>

        {custom.list.length ? (
          <ul className="grid max-h-60 grid-cols-2 gap-1.5 overflow-y-auto">
            {custom.list.map((item) => (
              <li
                key={item.name}
                className="flex items-center gap-2 rounded-md border border-hairline px-2 py-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="size-6" />
                <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                  :{item.name}:
                </span>
                {canManage ? (
                  <button
                    type="button"
                    aria-label={`Remove :${item.name}:`}
                    onClick={() => void remove(item.name)}
                    className="rounded-xs text-ink-3 hover:text-danger-text"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">No custom emoji yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
