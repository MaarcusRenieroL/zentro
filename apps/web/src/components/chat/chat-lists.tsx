"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AtSignIcon,
  BellRingIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  FileEditIcon,
  MessageSquareIcon,
  NewspaperIcon,
  Trash2Icon,
} from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { SummaryDialog } from "./chat-dialogs-extra";
import { useChatSidebar } from "./chat-store";
import {
  dayHeading,
  MessageBody,
  messageTime,
  relativeAgo,
  untilLabel,
} from "./message-body";
import { Avatar } from "./message-item";

type Outputs = inferRouterOutputs<AppRouter>["chat"];

const where = (channelName: string | null, channelId: string) =>
  channelName ? `/chat/${channelName}` : `/chat/dm/${channelId}`;

/** A page of one kind of list: icon, title, count and a body. */
export function ListPage({
  icon,
  title,
  count,
  actions,
  children,
}: {
  icon: ReactNode;
  title: string;
  count?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-tint-teams">
          {icon}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
        {count ? (
          <span className="rounded-full border border-hairline px-2 py-px font-mono text-xs text-ink-2">
            {count}
          </span>
        ) : null}
        <span className="flex-1" />
        {actions}
      </div>
      {children}
    </div>
  );
}

/** A row whose whole area opens a conversation, with its own links on top. */
export function JumpRow({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg border-t border-hairline/60 px-3 py-3 hover:bg-hover",
        className,
      )}
    >
      <Link
        href={href}
        aria-label={label}
        className="absolute inset-0 rounded-lg"
      />
      {children}
    </div>
  );
}

const above = "relative [&_a]:relative";

export function ListEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-serif-italic text-[2rem] leading-10">{title}</p>
      <p className="max-w-sm text-[15px] text-ink-2">{hint}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-5" aria-busy="true">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-14" />
      ))}
    </div>
  );
}

function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: ReadonlyArray<readonly [T, string, number]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="mt-4 flex gap-5 border-b border-hairline text-[15px]"
    >
      {tabs.map(([key, label, count]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "-mb-px border-b-2 py-2.5",
            value === key
              ? "border-ink font-medium"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          {label}
          <span className="ml-1.5 font-mono text-xs text-ink-3">{count}</span>
        </button>
      ))}
    </div>
  );
}

// ── Saved ─────────────────────────────────────────────────────────────────

type SavedItem = Outputs["savedList"][number];

/** Messages saved for later, with reminders. */
export function SavedView() {
  const trpc = useTrpcClient();
  const sidebar = useChatSidebar();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"open" | "reminders" | "done">("open");

  const load = useCallback(async () => {
    try {
      setItems(await trpc.chat.savedList.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = async (action: () => Promise<unknown>, fail: string) => {
    try {
      await action();
      await Promise.all([load(), sidebar.refresh()]);
    } catch (error) {
      toastError(error, fail);
    }
  };

  const open = items?.filter((item) => !item.completedAt) ?? [];
  const reminders = open.filter((item) => item.remindAt);
  const done = items?.filter((item) => item.completedAt) ?? [];
  const shown = tab === "open" ? open : tab === "reminders" ? reminders : done;

  return (
    <ListPage
      icon={<BookmarkIcon className="size-4" aria-hidden="true" />}
      title="Saved"
      count={items ? `${open.length} open` : undefined}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["open", "Saved", open.length],
          ["reminders", "Reminders", reminders.length],
          ["done", "Done", done.length],
        ]}
      />

      {items === null && !failed ? <ListSkeleton /> : null}
      {failed && !items ? (
        <p className="pt-8 text-center text-[15px] text-ink-2">
          Couldn’t load your saved messages.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="text-signal-strong underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}
      {items && !shown.length ? (
        <ListEmpty
          title={tab === "done" ? "Nothing finished yet." : "Nothing saved."}
          hint="Save a message from its ⋯ menu, or ask to be reminded about it. It’ll wait here."
        />
      ) : null}

      <div className="flex flex-col pt-3">
        {shown.map((item) => (
          <JumpRow
            key={item.message.id}
            href={`${where(item.channelName, item.message.channelId)}?m=${item.message.id}`}
            label={`Open message from ${item.message.author?.name ?? "someone"}`}
          >
            <Avatar name={item.message.author?.name ?? "Someone"} size={32} />
            <div className="pointer-events-none min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">
                  {item.message.author?.name}
                </span>{" "}
                <span className="text-ink-2">in</span>{" "}
                <span className="font-mono text-[13px] text-signal-strong">
                  {item.channelName
                    ? `#${item.channelName}`
                    : "a direct message"}
                </span>{" "}
                <span className="font-mono text-[11px] text-ink-3">
                  {relativeAgo(item.message.createdAt)}
                </span>
              </p>
              <div className={cn("line-clamp-3 text-[15px] leading-6", above)}>
                <MessageBody
                  body={item.message.body || "Attachment"}
                  names={item.message.names}
                />
              </div>
              {item.remindAt && !item.completedAt ? (
                <p
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px]",
                    item.due
                      ? "border-danger text-danger-text"
                      : "border-hairline text-ink-2",
                  )}
                >
                  <BellRingIcon className="size-3" aria-hidden="true" />
                  {item.due
                    ? "Reminder due"
                    : `Reminder ${untilLabel(item.remindAt)}`}
                </p>
              ) : null}
            </div>
            <div className="relative flex shrink-0 items-start gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={item.completedAt ? "Mark not done" : "Mark done"}
                title={item.completedAt ? "Mark not done" : "Mark done"}
                onClick={() =>
                  void change(
                    () =>
                      trpc.chat.completeSaved.mutate({
                        messageId: item.message.id,
                        done: !item.completedAt,
                      }),
                    "Could not update that",
                  )
                }
              >
                <CheckIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove from saved"
                title="Remove from saved"
                onClick={() =>
                  void change(
                    () =>
                      trpc.chat.saveMessage.mutate({
                        messageId: item.message.id,
                        saved: false,
                      }),
                    "Could not remove it",
                  )
                }
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </JumpRow>
        ))}
      </div>
    </ListPage>
  );
}

// ── Threads ───────────────────────────────────────────────────────────────

type ThreadItem = Outputs["threads"][number];

/** Threads you follow, newest activity first. */
export function ThreadsView() {
  const trpc = useTrpcClient();
  const sidebar = useChatSidebar();
  const [items, setItems] = useState<ThreadItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    try {
      setItems(await trpc.chat.threads.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = items?.filter((item) => item.unread) ?? [];
  const shown = (tab === "unread" ? unread : items) ?? [];
  const markAll = async () => {
    try {
      await Promise.all(
        unread.map((item) =>
          trpc.chat.markThreadRead.mutate({ parentId: item.message.id }),
        ),
      );
      await Promise.all([load(), sidebar.refresh()]);
    } catch (error) {
      toastError(error, "Could not mark them read");
    }
  };

  return (
    <ListPage
      icon={<MessageSquareIcon className="size-4" aria-hidden="true" />}
      title="Threads"
      count={unread.length ? `${unread.length} unread` : undefined}
      actions={
        <Button
          variant="outline"
          disabled={!unread.length}
          onClick={() => void markAll()}
        >
          Mark all read
        </Button>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["all", "All", items?.length ?? 0],
          ["unread", "Unread", unread.length],
        ]}
      />

      {items === null && !failed ? <ListSkeleton /> : null}
      {failed && !items ? (
        <p className="pt-8 text-center text-[15px] text-ink-2">
          Couldn’t load your threads.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="text-signal-strong underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}
      {items && !shown.length ? (
        <ListEmpty
          title={tab === "unread" ? "No unread threads." : "No threads yet."}
          hint="Threads you start, reply in, or follow show up here with what’s new."
        />
      ) : null}

      <div className="flex flex-col pt-3">
        {shown.map((item) => (
          <JumpRow
            key={item.message.id}
            href={`${where(item.channelName, item.message.channelId)}?m=${item.message.id}&thread=${item.message.id}`}
            label={`Open thread by ${item.message.author?.name ?? "someone"}`}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-3 size-[7px] shrink-0 rounded-full",
                item.unread ? "bg-ink" : "bg-transparent",
              )}
            />
            <Avatar name={item.message.author?.name ?? "Someone"} size={32} />
            <div className="pointer-events-none min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">
                  {item.message.author?.name}
                </span>{" "}
                <span className="text-ink-2">in</span>{" "}
                <span className="font-mono text-[13px] text-signal-strong">
                  {item.channelName
                    ? `#${item.channelName}`
                    : "a direct message"}
                </span>
              </p>
              <div className={cn("line-clamp-2 text-[15px] leading-6", above)}>
                <MessageBody
                  body={item.message.body || "Attachment"}
                  names={item.message.names}
                />
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-ink-3">
                {item.message.replies?.count ?? 0}{" "}
                {(item.message.replies?.count ?? 0) === 1 ? "reply" : "replies"}{" "}
                · last {relativeAgo(item.lastAt)}
                {item.unread ? (
                  <span className="ml-2 rounded-full bg-ink px-1.5 text-ink-inverse">
                    {item.unread} new
                  </span>
                ) : null}
              </p>
            </div>
          </JumpRow>
        ))}
      </div>
    </ListPage>
  );
}

// ── Drafts and scheduled ──────────────────────────────────────────────────

/** Unsent drafts and messages waiting to go out. */
export function DraftsView() {
  const trpc = useTrpcClient();
  const sidebar = useChatSidebar();
  const [drafts, setDrafts] = useState<Outputs["draftList"] | null>(null);
  const [scheduled, setScheduled] = useState<Outputs["scheduledList"] | null>(
    null,
  );
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        trpc.chat.draftList.query(),
        trpc.chat.scheduledList.query(),
      ]);

      setDrafts(d);
      setScheduled(s);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async (id: string) => {
    try {
      await trpc.chat.scheduledCancel.mutate({ id });
      toastSuccess("Scheduled message canceled");
      await Promise.all([load(), sidebar.refresh()]);
    } catch (error) {
      toastError(error, "Could not cancel it");
    }
  };

  const loaded = drafts !== null && scheduled !== null;

  return (
    <ListPage
      icon={<FileEditIcon className="size-4" aria-hidden="true" />}
      title="Drafts & scheduled"
    >
      {!loaded && !failed ? <ListSkeleton /> : null}
      {failed && !loaded ? (
        <p className="pt-8 text-center text-[15px] text-ink-2">
          Couldn’t load your drafts.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="text-signal-strong underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}
      {loaded && !drafts.length && !scheduled.length ? (
        <ListEmpty
          title="No drafts."
          hint="Anything you start typing and don’t send is kept here. Use the arrow next to Send to schedule a message."
        />
      ) : null}

      {scheduled?.length ? (
        <section className="flex flex-col pt-5">
          <h3 className="eyebrow px-3 pb-1.5">
            Scheduled · {scheduled.length}
          </h3>
          {scheduled.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border-t border-hairline/60 px-3 py-3"
            >
              <ClockIcon
                className="mt-1 size-4 shrink-0 text-ink-3"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="text-ink-2">To</span>{" "}
                  <Link
                    href={where(item.channelName, item.channelId)}
                    className="font-mono text-[13px] text-signal-strong hover:underline"
                  >
                    {item.channelName
                      ? `#${item.channelName}`
                      : "a direct message"}
                  </Link>
                  {item.inThread ? (
                    <span className="text-ink-3"> · reply in thread</span>
                  ) : null}{" "}
                  <span className="font-mono text-[11px] text-ink-3">
                    {dayHeading(item.sendAt)} {messageTime(item.sendAt)} ·{" "}
                    {untilLabel(item.sendAt)}
                  </span>
                </p>
                <p className="line-clamp-3 text-[15px] leading-6">
                  {item.body}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void cancel(item.id)}
              >
                Cancel
              </Button>
            </div>
          ))}
        </section>
      ) : null}

      {drafts?.length ? (
        <section className="flex flex-col pt-5">
          <h3 className="eyebrow px-3 pb-1.5">Drafts · {drafts.length}</h3>
          {drafts.map((draft) => (
            <JumpRow
              key={`${draft.channelId}-${draft.inThread}-${draft.updatedAt.toString()}`}
              href={where(draft.channelName, draft.channelId)}
              label="Continue this draft"
            >
              <FileEditIcon
                className="mt-1 size-4 shrink-0 text-ink-3"
                aria-hidden="true"
              />
              <div className="pointer-events-none min-w-0 flex-1">
                <p className="text-sm">
                  <span className="text-ink-2">
                    {draft.inThread ? "Thread reply in" : "Message to"}
                  </span>{" "}
                  <span className="font-mono text-[13px] text-signal-strong">
                    {draft.channelName
                      ? `#${draft.channelName}`
                      : "a direct message"}
                  </span>{" "}
                  <span className="font-mono text-[11px] text-ink-3">
                    edited {relativeAgo(draft.updatedAt)}
                  </span>
                </p>
                <p className="line-clamp-2 text-[15px] leading-6 text-ink-2">
                  {draft.body.replace(/<@[0-9a-f-]{36}>/g, "@someone")}
                </p>
              </div>
              <span className="self-center font-mono text-xs text-ink-3 opacity-0 group-hover:opacity-100">
                Continue
              </span>
            </JumpRow>
          ))}
        </section>
      ) : null}
    </ListPage>
  );
}

// ── Catch up ──────────────────────────────────────────────────────────────

type CatchUpItem = Outputs["catchUp"][number];

/** What happened in the conversations you were away from. */
export function CatchUpView() {
  const trpc = useTrpcClient();
  const sidebar = useChatSidebar();
  const [items, setItems] = useState<CatchUpItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [summarize, setSummarize] = useState<CatchUpItem | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await trpc.chat.catchUp.query());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (channelIds: string[]) => {
    try {
      await Promise.all(
        channelIds.map((channelId) => trpc.chat.markRead.mutate({ channelId })),
      );
      await Promise.all([load(), sidebar.refresh()]);
    } catch (error) {
      toastError(error, "Could not mark it read");
    }
  };

  return (
    <ListPage
      icon={<NewspaperIcon className="size-4" aria-hidden="true" />}
      title="Catch up"
      count={items?.length ? `${items.length} with news` : undefined}
      actions={
        <Button
          variant="outline"
          disabled={!items?.length}
          onClick={() =>
            void markRead(items?.map((item) => item.channelId) ?? [])
          }
        >
          Mark all read
        </Button>
      }
    >
      {items === null && !failed ? <ListSkeleton /> : null}
      {failed && !items ? (
        <p className="pt-8 text-center text-[15px] text-ink-2">
          Couldn’t load the digest.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="text-signal-strong underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}
      {items && !items.length ? (
        <ListEmpty
          title="You’re all caught up."
          hint="When conversations you’re in get new messages, a short digest of each shows here."
        />
      ) : null}

      <div className="grid gap-3 pt-5 lg:grid-cols-2">
        {items?.map((item) => (
          <article
            key={item.channelId}
            className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4"
          >
            <header className="flex items-center gap-2">
              <Link
                href={where(item.channelName, item.channelId)}
                className="min-w-0 flex-1 truncate font-semibold hover:underline"
              >
                {item.channelName ? `#${item.channelName}` : "Direct message"}
              </Link>
              {item.mentions ? (
                <span className="flex items-center gap-1 rounded-full bg-ink px-2 font-mono text-[11px] text-ink-inverse">
                  <AtSignIcon className="size-3" aria-hidden="true" />
                  {item.mentions}
                </span>
              ) : null}
              <span className="font-mono text-xs text-ink-2">
                {item.count} new
              </span>
            </header>
            <p className="text-[13px] text-ink-2">
              From {item.people.join(", ")}
            </p>
            <p className="line-clamp-2 text-[15px] leading-6">{item.latest}</p>
            {item.tasks.length ? (
              <p className="flex flex-wrap gap-1.5">
                {item.tasks.map((key) => (
                  <Link
                    key={key}
                    href={`/tasks/${key}`}
                    className="rounded-xs border border-hairline px-1.5 font-mono text-[11px] text-ink-2 hover:text-ink"
                  >
                    {key}
                  </Link>
                ))}
              </p>
            ) : null}
            <footer className="mt-1 flex items-center gap-2">
              <Button asChild size="sm">
                <Link href={where(item.channelName, item.channelId)}>Open</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSummarize(item)}
              >
                Summarize
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void markRead([item.channelId])}
              >
                Mark read
              </Button>
            </footer>
          </article>
        ))}
      </div>

      {summarize ? (
        <SummaryDialog
          channelId={summarize.channelId}
          title={
            summarize.channelName
              ? `#${summarize.channelName}`
              : "Direct message"
          }
          onClose={() => setSummarize(null)}
        />
      ) : null}
    </ListPage>
  );
}
