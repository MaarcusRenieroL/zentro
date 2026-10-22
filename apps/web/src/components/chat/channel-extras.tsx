"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BookmarkIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  NotebookPenIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

import { MessageBody } from "./message-body";

type Bookmark = { id: string; title: string; url: string };

/** The channel's shared note and pinned links, above the messages. */
export function ChannelInfoBar({
  channelId,
  canvas,
  canEdit,
  onChanged,
}: {
  channelId: string;
  canvas: string | null;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const trpc = useTrpcClient();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(canvas ?? "");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const load = useCallback(async () => {
    try {
      setBookmarks(await trpc.chat.bookmarks.query({ channelId }));
    } catch {
      setBookmarks([]);
    }
  }, [trpc, channelId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDraft(canvas ?? "");
  }, [canvas]);

  const saveCanvas = async () => {
    try {
      await trpc.chat.setCanvas.mutate({ channelId, canvas: draft });
      setEditing(false);
      onChanged();
    } catch (error) {
      toastError(error, "Could not save the note");
    }
  };

  const addBookmark = async () => {
    try {
      await trpc.chat.addBookmark.mutate({
        channelId,
        title: title.trim(),
        url: url.trim(),
      });
      setTitle("");
      setUrl("");
      setAdding(false);
      await load();
    } catch (error) {
      toastError(error, "Could not add the bookmark");
    }
  };

  const removeBookmark = async (id: string) => {
    try {
      await trpc.chat.removeBookmark.mutate({ id });
      await load();
    } catch (error) {
      toastError(error, "Could not remove the bookmark");
    }
  };

  if (!canvas && !bookmarks.length && !canEdit) return null;

  return (
    <div className="flex flex-col gap-1.5 border-b border-hairline bg-sunken/40 px-5 py-1.5 text-[13px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-1 text-ink-2 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <NotebookPenIcon className="size-3.5" aria-hidden="true" />
          <span className="font-medium">{canvas ? "Note" : "Add a note"}</span>
          <ChevronDownIcon
            className={cn("size-3 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        <span aria-hidden="true" className="h-4 w-px bg-hairline" />
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {bookmarks.map((bookmark) => {
            const internal = bookmark.url.startsWith("/");

            return (
              <li
                key={bookmark.id}
                className="group/bm flex shrink-0 items-center"
              >
                {internal ? (
                  <Link
                    href={bookmark.url}
                    className="flex items-center gap-1 rounded-sm px-1.5 py-1 hover:bg-hover"
                  >
                    <BookmarkIcon
                      className="size-3 text-ink-3"
                      aria-hidden="true"
                    />
                    {bookmark.title}
                  </Link>
                ) : (
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1 rounded-sm px-1.5 py-1 hover:bg-hover"
                  >
                    <BookmarkIcon
                      className="size-3 text-ink-3"
                      aria-hidden="true"
                    />
                    {bookmark.title}
                    <ExternalLinkIcon
                      className="size-3 text-ink-3"
                      aria-hidden="true"
                    />
                  </a>
                )}
                {canEdit ? (
                  <button
                    type="button"
                    aria-label={`Remove bookmark ${bookmark.title}`}
                    onClick={() => void removeBookmark(bookmark.id)}
                    className="hidden rounded-xs p-0.5 text-ink-3 hover:text-danger-text group-hover/bm:block focus-visible:block"
                  >
                    <XIcon className="size-3" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
        {canEdit ? (
          <Popover open={adding} onOpenChange={setAdding}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1 px-2 text-ink-2"
                aria-label="Add a bookmark"
              >
                <PlusIcon className="size-3.5" />
                Bookmark
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-2 p-3">
              <p className="text-sm font-semibold">
                Pin a link to this channel
              </p>
              <Input
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                aria-label="Bookmark title"
              />
              <Input
                value={url}
                maxLength={500}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://… or /docs/runbook"
                aria-label="Bookmark address"
              />
              <Button
                size="sm"
                disabled={!title.trim() || !url.trim()}
                onClick={() => void addBookmark()}
              >
                Add bookmark
              </Button>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {open ? (
        <div className="rounded-lg border border-hairline bg-canvas p-3">
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={draft}
                autoFocus
                maxLength={5000}
                rows={5}
                onChange={(event) => setDraft(event.target.value)}
                aria-label="Channel note"
                className="w-full resize-y rounded-md border border-signal bg-surface px-3 py-2 text-[14px] leading-6 outline-none"
                placeholder="Goals, rules, links people keep asking for. Supports the same formatting as messages."
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => void saveCanvas()}>
                  Save note
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(canvas ?? "");
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <span className="ml-auto font-mono text-[11px] text-ink-3">
                  {draft.length}/5000
                </span>
              </div>
            </div>
          ) : canvas ? (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 text-[14px] leading-6">
                <MessageBody body={canvas} names={{}} />
              </div>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 text-ink-2">
              <span>
                No note yet. Use it for goals, rules and useful links.
              </span>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  Write a note
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** "Arjun is typing…" above the composer. */
export function TypingLine({ names }: { names: string[] }) {
  if (!names.length) return <div className="h-5" aria-hidden="true" />;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : "Several people are typing";

  return (
    <p
      role="status"
      aria-live="polite"
      className="flex h-5 items-center gap-1.5 px-1 text-xs text-ink-3"
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1 animate-bounce rounded-full bg-ink-3"
            style={{ animationDelay: `${dot * 120}ms` }}
          />
        ))}
      </span>
      {label}
    </p>
  );
}
