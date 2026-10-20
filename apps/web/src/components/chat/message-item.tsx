"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircleIcon,
  CheckSquareIcon,
  CopyIcon,
  FileIcon,
  FileTextIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  SmilePlusIcon,
  Trash2Icon,
} from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import { toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { paths } from "~/src/lib/paths";

import {
  fileSize,
  MessageBody,
  messageTime,
  relativeAgo,
} from "./message-body";

type Outputs = inferRouterOutputs<AppRouter>;
export type MessageView = Outputs["chat"]["messages"]["messages"][number];
export type AttachmentView = MessageView["attachments"][number];

/** A message that has not reached the server yet. */
export type LocalState = "sending" | "queued" | "failed";

const quickReactions = ["👍", "✅", "👀", "🎉", "🙏"];

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "Review",
  done: "Done",
};

const presenceDot: Record<string, string> = {
  active: "bg-success",
  away: "bg-warning",
  offline: "border border-ink-3 bg-surface",
};

export function Avatar({
  name,
  presence,
  size = 36,
}: {
  name: string;
  presence?: "active" | "away" | "offline";
  size?: number;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <ActorAvatar name={name} size={size} />
      {presence ? (
        <span
          role="img"
          aria-label={
            presence === "active"
              ? "Active now"
              : presence === "away"
                ? "Away"
                : "Offline"
          }
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-canvas",
            presenceDot[presence],
          )}
        />
      ) : null}
    </span>
  );
}

function isImage(file: AttachmentView) {
  return ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
    file.mimeType,
  );
}

function extensionOf(file: AttachmentView) {
  return (file.name.split(".").pop() ?? "file").slice(0, 4).toUpperCase();
}

/** Images as a grid, other files as cards; both open the file preview. */
function Attachments({
  files,
  onOpen,
}: {
  files: AttachmentView[];
  onOpen: (file: AttachmentView, all: AttachmentView[]) => void;
}) {
  const images = files.filter(isImage);
  const others = files.filter((file) => !isImage(file));

  return (
    <div className="mt-1.5 flex flex-col gap-2">
      {images.length ? (
        <div
          className={cn(
            "grid max-w-md gap-1.5",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {images.slice(0, 4).map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => onOpen(file, files)}
              aria-label={`Open ${file.name}`}
              className="group relative overflow-hidden rounded-lg border border-hairline bg-sunken outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.name}
                loading="lazy"
                width={file.width ?? undefined}
                height={file.height ?? undefined}
                className={cn(
                  "w-full object-cover",
                  images.length === 1 ? "max-h-72" : "aspect-[4/3]",
                )}
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-scrim to-transparent px-2 pt-4 pb-1 text-left font-mono text-[11px] text-on-signal opacity-0 group-hover:opacity-100">
                {file.name}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {others.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => onOpen(file, files)}
          className="flex w-full max-w-md items-center gap-3 rounded-lg border border-hairline bg-surface p-2.5 text-left outline-none hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-tint-docs font-mono text-[10px]">
            {extensionOf(file)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {file.name}
            </span>
            <span className="block font-mono text-[11px] text-ink-3">
              {fileSize(file.size)}
            </span>
          </span>
          <FileIcon className="size-4 text-ink-3" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: MessageView["tasks"][number] }) {
  return (
    <Link
      href={paths.task(task.key)}
      className="mt-1.5 flex max-w-md items-center gap-2.5 rounded-lg border border-hairline bg-surface px-3 py-2 outline-none hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <StatusGlyph status={task.status} size={14} decorative />
      <span className="font-mono text-xs text-ink-3">{task.key}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {task.name}
      </span>
      <span className="shrink-0 text-xs text-ink-2">
        {statusLabels[task.status] ?? task.status}
      </span>
      {task.assignee ? <ActorAvatar name={task.assignee} size={20} /> : null}
    </Link>
  );
}

export type MessageActions = {
  onReply?: (message: MessageView) => void;
  onReact: (message: MessageView, emoji: string) => void;
  onPin?: (message: MessageView) => void;
  onEdit?: (message: MessageView, body: string) => Promise<void> | void;
  onDelete?: (message: MessageView) => void;
  onCreateTask?: (message: MessageView) => void;
  onOpenFile: (file: AttachmentView, all: AttachmentView[]) => void;
  onRetry?: (message: MessageView) => void;
  onDiscard?: (message: MessageView) => void;
};

export function MessageItem({
  message,
  meId,
  grouped = false,
  highlighted = false,
  canPost,
  canModerate = false,
  local,
  inThread = false,
  actions,
}: {
  message: MessageView;
  meId: string;
  /** Same person as the message above, close in time: no avatar or name. */
  grouped?: boolean;
  highlighted?: boolean;
  canPost: boolean;
  canModerate?: boolean;
  local?: LocalState;
  inThread?: boolean;
  actions: MessageActions;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const names = message.names;
  const keys = new Set(message.tasks.map((task) => task.key));
  const authorName = message.author?.name ?? "Someone";

  if (message.deleted) {
    return (
      <div className={cn("flex gap-3 px-4 py-1", grouped ? "" : "pt-3")}>
        <span className="w-9 shrink-0" />
        <p className="text-sm text-ink-3 italic">This message was deleted.</p>
      </div>
    );
  }

  const copyLink = () => {
    const url = new URL(window.location.href);

    url.searchParams.set("m", message.id);
    void navigator.clipboard
      .writeText(url.toString())
      .then(() => toastSuccess("Link copied"));
  };

  return (
    <article
      id={`message-${message.id}`}
      data-highlighted={highlighted || undefined}
      className={cn(
        "group relative flex gap-3 px-4 py-1 hover:bg-hover/60",
        grouped ? "" : "pt-3",
        highlighted && "bg-signal-subtle/60",
        local === "failed" && "bg-danger-subtle/40",
      )}
    >
      <span className="w-9 shrink-0">
        {grouped ? (
          <span className="hidden pt-1 text-right font-mono text-[10px] text-ink-3 group-hover:block">
            {messageTime(message.createdAt)}
          </span>
        ) : (
          <Avatar name={authorName} presence={message.author?.presence} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        {grouped ? null : (
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold">{authorName}</span>
            <time
              dateTime={new Date(message.createdAt).toISOString()}
              className="font-mono text-[11px] text-ink-3"
            >
              {messageTime(message.createdAt)}
            </time>
            {message.pinned ? (
              <PinIcon className="size-3 text-ink-3" aria-label="Pinned" />
            ) : null}
          </div>
        )}

        {editing ? (
          <div className="mt-1 flex flex-col gap-2">
            <textarea
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditing(false);

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void Promise.resolve(actions.onEdit?.(message, draft)).then(
                    () => setEditing(false),
                  );
                }
              }}
              rows={2}
              aria-label="Edit message"
              className="w-full resize-none rounded-lg border border-signal bg-surface px-3 py-2 text-[15px] leading-6 outline-none"
            />
            <div className="flex gap-2 text-xs text-ink-3">
              <span>Esc to cancel · ↵ to save</span>
            </div>
          </div>
        ) : message.body ? (
          <p className="text-[15px] leading-6">
            <MessageBody
              body={message.body}
              names={names}
              meId={meId}
              taskKeys={keys}
            />
            {message.editedAt ? (
              <span className="ml-1.5 text-[11px] text-ink-3">(edited)</span>
            ) : null}
          </p>
        ) : null}

        {message.attachments.length ? (
          <Attachments
            files={message.attachments}
            onOpen={actions.onOpenFile}
          />
        ) : null}

        {message.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {message.reactions.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                disabled={!canPost}
                title={reaction.names.join(", ")}
                aria-pressed={reaction.mine}
                onClick={() => actions.onReact(message, reaction.emoji)}
                className={cn(
                  "flex h-6 items-center gap-1 rounded-full border px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  reaction.mine
                    ? "border-signal bg-signal-subtle text-ink"
                    : "border-hairline bg-surface text-ink-2 hover:border-ink-3",
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-mono">{reaction.count}</span>
              </button>
            ))}
            {canPost ? (
              <ReactionPicker
                onPick={(value) => actions.onReact(message, value)}
                trigger={
                  <button
                    type="button"
                    aria-label="Add a reaction"
                    className="flex size-6 items-center justify-center rounded-full border border-hairline text-ink-3 hover:border-ink-3 hover:text-ink"
                  >
                    <SmilePlusIcon className="size-3.5" />
                  </button>
                }
              />
            ) : null}
          </div>
        ) : null}

        {!inThread && message.replies && message.replies.count > 0 ? (
          <button
            type="button"
            onClick={() => actions.onReply?.(message)}
            className="mt-1.5 flex items-center gap-2 rounded-md px-1.5 py-0.5 text-[13px] text-signal-strong outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageSquareIcon className="size-3.5" aria-hidden="true" />
            <span className="font-medium">
              {message.replies.count}{" "}
              {message.replies.count === 1 ? "reply" : "replies"}
            </span>
            {message.replies.lastAt ? (
              <span className="text-ink-3">
                Last reply {relativeAgo(message.replies.lastAt)}
              </span>
            ) : null}
          </button>
        ) : null}

        {local === "failed" ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-danger-text">
            <AlertCircleIcon className="size-3.5" aria-hidden="true" />
            Not sent.
            <button
              type="button"
              onClick={() => actions.onRetry?.(message)}
              className="underline underline-offset-2"
            >
              Retry
            </button>
            ·
            <button
              type="button"
              onClick={() => actions.onDiscard?.(message)}
              className="underline underline-offset-2"
            >
              Delete
            </button>
          </p>
        ) : null}
        {local === "queued" ? (
          <p className="mt-1 text-xs text-ink-3">
            Queued · sends when you’re back online
          </p>
        ) : null}
        {local === "sending" ? (
          <p className="mt-1 text-xs text-ink-3">Sending…</p>
        ) : null}
      </div>

      {!local && !editing ? (
        <div className="absolute -top-3 right-4 z-10 hidden items-center rounded-md border border-hairline bg-surface p-0.5 shadow-sm group-focus-within:flex group-hover:flex">
          {canPost ? (
            <>
              {quickReactions.slice(0, 3).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`React with ${value}`}
                  onClick={() => actions.onReact(message, value)}
                  className="rounded-sm px-1.5 py-1 text-sm hover:bg-hover"
                >
                  {value}
                </button>
              ))}
              <ReactionPicker
                onPick={(value) => actions.onReact(message, value)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7"
                    aria-label="More reactions"
                  >
                    <SmilePlusIcon className="size-4" />
                  </Button>
                }
              />
            </>
          ) : null}
          {!inThread && canPost && actions.onReply ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7"
              aria-label="Reply in thread"
              onClick={() => actions.onReply?.(message)}
            >
              <MessageSquareIcon className="size-4" />
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="More actions"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {actions.onCreateTask ? (
                <DropdownMenuItem
                  onClick={() => actions.onCreateTask?.(message)}
                >
                  <CheckSquareIcon className="size-4" />
                  Create task
                </DropdownMenuItem>
              ) : null}
              {actions.onPin && !inThread ? (
                <DropdownMenuItem onClick={() => actions.onPin?.(message)}>
                  <PinIcon className="size-4" />
                  {message.pinned ? "Unpin" : "Pin to channel"}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={copyLink}>
                <CopyIcon className="size-4" />
                Copy link
              </DropdownMenuItem>
              {message.mine && actions.onEdit ? (
                <DropdownMenuItem
                  onClick={() => {
                    setDraft(message.body);
                    setEditing(true);
                  }}
                >
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {(message.mine || canModerate) && actions.onDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => actions.onDelete?.(message)}
                  >
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </article>
  );
}

function ReactionPicker({
  onPick,
  trigger,
}: {
  onPick: (emoji: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto gap-1 p-1.5">
        {[...quickReactions, "😄", "🤔", "🚀", "❤️"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              onPick(value);
              setOpen(false);
            }}
            className="rounded-sm p-1 text-lg hover:bg-hover"
          >
            {value}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export { FileTextIcon };
