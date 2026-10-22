"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ActivityIcon,
  AlertCircleIcon,
  BellRingIcon,
  BookmarkIcon,
  CheckSquareIcon,
  CopyIcon,
  CornerUpRightIcon,
  FileIcon,
  FileTextIcon,
  LanguagesIcon,
  MailOpenIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  SmilePlusIcon,
  Trash2Icon,
  XIcon,
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  EntityCard,
  ForwardedBlock,
  HuddleCard,
  LinkPreviewCard,
  PollCard,
} from "./message-cards";
import {
  fileSize,
  MessageBody,
  messageTime,
  relativeAgo,
  untilLabel,
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
  onSave?: (message: MessageView, saved: boolean) => void;
  /** Remind the caller at a time, or null to clear the reminder. */
  onRemind?: (message: MessageView, at: Date | null) => void;
  onMarkUnread?: (message: MessageView) => void;
  onForward?: (message: MessageView) => void;
  onVote?: (pollId: string, index: number) => void;
  onClosePoll?: (pollId: string) => void;
  /** Translated text for a message, or a rejection with the reason. */
  onTranslate?: (message: MessageView, language: string) => Promise<string>;
  /** Start a doc from this message and its thread. */
  onMakeDoc?: (message: MessageView) => void;
};

const reminderChoices: Array<[string, () => Date]> = [
  ["In 20 minutes", () => new Date(Date.now() + 20 * 60_000)],
  ["In 1 hour", () => new Date(Date.now() + 60 * 60_000)],
  ["In 3 hours", () => new Date(Date.now() + 3 * 60 * 60_000)],
  [
    "Tomorrow at 9:00",
    () => {
      const date = new Date();

      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);

      return date;
    },
  ],
  [
    "Next Monday at 9:00",
    () => {
      const date = new Date();

      date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7));
      date.setHours(9, 0, 0, 0);

      return date;
    },
  ],
];

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Japanese",
  "Chinese",
];

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
  // The toolbar only shows on hover; keep it mounted while a menu anchored to
  // it is open, or the menu loses its anchor when the pointer moves into it.
  const [toolbarPinned, setToolbarPinned] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [translation, setTranslation] = useState<{
    language: string;
    text: string | null;
    error?: string;
  } | null>(null);
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

  if (message.kind === "event") {
    // An activity post: one quiet line, not a conversation turn.
    return (
      <article
        id={`message-${message.id}`}
        className="flex items-center gap-3 px-4 py-1 text-[13px] text-ink-2"
      >
        <span className="flex w-9 shrink-0 justify-center">
          <ActivityIcon className="size-3.5 text-ink-3" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-medium text-ink">{authorName}</span>{" "}
          <MessageBody
            body={message.body}
            names={names}
            meId={meId}
            taskKeys={keys}
          />
        </span>
        <time
          dateTime={new Date(message.createdAt).toISOString()}
          className="font-mono text-[11px] text-ink-3"
        >
          {messageTime(message.createdAt)}
        </time>
      </article>
    );
  }

  const translate = (language: string) => {
    setTranslation({ language, text: null });
    void Promise.resolve(actions.onTranslate?.(message, language))
      .then((text) => setTranslation({ language, text: text ?? "" }))
      .catch((error: Error) =>
        setTranslation({ language, text: null, error: error.message }),
      );
  };

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
      data-message={message.id}
      data-highlighted={highlighted || undefined}
      tabIndex={local ? undefined : 0}
      aria-label={`Message from ${authorName}`}
      onKeyDown={(event) => {
        // Shortcuts only when the message itself has focus, never in a field.
        if (event.target !== event.currentTarget || editing || local) return;

        if (event.key === "e" && message.mine && actions.onEdit) {
          event.preventDefault();
          setDraft(message.body);
          setEditing(true);
        } else if (
          event.key === "r" &&
          !inThread &&
          canPost &&
          actions.onReply
        ) {
          event.preventDefault();
          actions.onReply(message);
        } else if (event.key === "s" && actions.onSave) {
          event.preventDefault();
          actions.onSave(message, !message.saved);
        } else if (event.key === "u" && actions.onMarkUnread) {
          event.preventDefault();
          actions.onMarkUnread(message);
        } else if (event.key === "+" || event.key === "=") {
          if (canPost) {
            event.preventDefault();
            actions.onReact(message, "👍");
          }
        }
      }}
      className={cn(
        "group relative flex gap-3 px-4 py-1 outline-none hover:bg-hover/60 focus-visible:bg-hover/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
            {message.author?.status?.emoji ? (
              <span
                title={message.author.status.text ?? undefined}
                aria-label={message.author.status.text ?? "Status"}
                className="text-sm"
              >
                {message.author.status.emoji}
              </span>
            ) : null}
            <time
              dateTime={new Date(message.createdAt).toISOString()}
              className="font-mono text-[11px] text-ink-3"
            >
              {messageTime(message.createdAt)}
            </time>
            {message.pinned ? (
              <PinIcon className="size-3 text-ink-3" aria-label="Pinned" />
            ) : null}
            {message.saved ? (
              <span
                className="flex items-center gap-1 text-[11px] text-signal-strong"
                title={
                  message.saved.remindAt
                    ? `Reminder ${untilLabel(message.saved.remindAt)}`
                    : "Saved for later"
                }
              >
                {message.saved.remindAt ? (
                  <BellRingIcon className="size-3" aria-hidden="true" />
                ) : (
                  <BookmarkIcon
                    className="size-3 fill-current"
                    aria-hidden="true"
                  />
                )}
                <span className="sr-only">Saved</span>
              </span>
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
        ) : message.body &&
          message.kind !== "poll" &&
          message.kind !== "huddle" ? (
          <div className="text-[15px] leading-6">
            <MessageBody
              body={message.body}
              names={names}
              meId={meId}
              taskKeys={keys}
            />
            {message.editedAt ? (
              <span className="ml-1.5 text-[11px] text-ink-3">(edited)</span>
            ) : null}
          </div>
        ) : null}

        {translation ? (
          <div className="mt-1.5 flex max-w-xl items-start gap-2 rounded-lg border border-hairline bg-sunken/60 px-3 py-2 text-[14px]">
            <LanguagesIcon
              className="mt-0.5 size-3.5 shrink-0 text-ink-3"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[11px] text-ink-3">
                Translated to {translation.language}
              </span>
              {translation.error ? (
                <span className="text-danger-text">{translation.error}</span>
              ) : translation.text === null ? (
                <span className="text-ink-3">Translating…</span>
              ) : (
                <MessageBody
                  body={translation.text}
                  names={names}
                  meId={meId}
                />
              )}
            </span>
            <button
              type="button"
              aria-label="Dismiss translation"
              onClick={() => setTranslation(null)}
              className="rounded-xs text-ink-3 hover:text-ink"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : null}

        {message.forwarded ? (
          <ForwardedBlock forwarded={message.forwarded} />
        ) : null}

        {message.poll ? (
          <PollCard
            poll={message.poll}
            canVote={canPost && Boolean(actions.onVote)}
            canClose={
              (message.mine || canModerate) && Boolean(actions.onClosePoll)
            }
            onVote={(index) => actions.onVote?.(message.poll!.id, index)}
            onClose={() => actions.onClosePoll?.(message.poll!.id)}
          />
        ) : null}

        {message.kind === "huddle" && typeof message.meta?.url === "string" ? (
          <HuddleCard url={message.meta.url} />
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

        {message.entities.map((entity, index) => (
          <EntityCard key={`${entity.type}-${index}`} entity={entity} />
        ))}

        {message.links.map((link) => (
          <LinkPreviewCard key={link.url} link={link} />
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
                onOpenChange={setToolbarPinned}
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
        <div
          className={cn(
            "absolute -top-3 right-4 z-10 items-center rounded-md border border-hairline bg-surface p-0.5 shadow-sm group-focus-within:flex group-hover:flex",
            toolbarPinned ? "flex" : "hidden",
          )}
        >
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
          <DropdownMenu onOpenChange={setToolbarPinned}>
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
            <DropdownMenuContent align="end" className="w-56">
              {actions.onCreateTask ? (
                <DropdownMenuItem
                  onClick={() => actions.onCreateTask?.(message)}
                >
                  <CheckSquareIcon className="size-4" />
                  Create task
                </DropdownMenuItem>
              ) : null}
              {actions.onMakeDoc && !inThread ? (
                <DropdownMenuItem onClick={() => actions.onMakeDoc?.(message)}>
                  <FileTextIcon className="size-4" />
                  Turn into doc
                </DropdownMenuItem>
              ) : null}
              {actions.onSave ? (
                <DropdownMenuItem
                  onClick={() => actions.onSave?.(message, !message.saved)}
                >
                  <BookmarkIcon className="size-4" />
                  {message.saved ? "Remove from saved" : "Save for later"}
                </DropdownMenuItem>
              ) : null}
              {actions.onRemind ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <BellRingIcon className="size-4" />
                    Remind me
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    {reminderChoices.map(([label, at]) => (
                      <DropdownMenuItem
                        key={label}
                        onClick={() => actions.onRemind?.(message, at())}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                    {message.saved?.remindAt ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => actions.onRemind?.(message, null)}
                        >
                          Clear reminder
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              {actions.onMarkUnread ? (
                <DropdownMenuItem
                  onClick={() => actions.onMarkUnread?.(message)}
                >
                  <MailOpenIcon className="size-4" />
                  Mark unread from here
                </DropdownMenuItem>
              ) : null}
              {actions.onForward ? (
                <DropdownMenuItem onClick={() => actions.onForward?.(message)}>
                  <CornerUpRightIcon className="size-4" />
                  Forward…
                </DropdownMenuItem>
              ) : null}
              {actions.onTranslate && message.body ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <LanguagesIcon className="size-4" />
                    Translate to…
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    {languages.map((language) => (
                      <DropdownMenuItem
                        key={language}
                        onClick={() => translate(language)}
                      >
                        {language}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              <DropdownMenuSeparator />
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
  onOpenChange,
  trigger,
}: {
  onPick: (emoji: string) => void;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const changeOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto gap-1 p-1.5">
        {[...quickReactions, "😄", "🤔", "🚀", "❤️"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              onPick(value);
              changeOpen(false);
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
