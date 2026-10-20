"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BellIcon,
  BellOffIcon,
  HashIcon,
  LockIcon,
  PinIcon,
  SearchIcon,
  SettingsIcon,
  WifiOffIcon,
} from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";
import { usePermission } from "~/src/components/permissions/permission-provider";

import { ChannelSettingsDialog } from "./channel-settings-dialog";
import { useChatSidebar } from "./chat-store";
import { Composer, type Draft, type Person } from "./composer";
import { FilePreviewDialog } from "./file-preview";
import { dayHeading, MessageBody, messageTime } from "./message-body";
import {
  Avatar,
  MessageItem,
  type AttachmentView,
  type LocalState,
  type MessageActions,
  type MessageView,
} from "./message-item";
import { NoAccessView } from "./states";
import { ThreadPanel } from "./thread-panel";

type Outputs = inferRouterOutputs<AppRouter>;
export type ChannelData = Extract<Outputs["chat"]["get"], { access: "full" }>;

type Local = {
  localId: string;
  state: LocalState;
  draft: Draft;
  parentId?: string;
  view: MessageView;
};

const FIVE_MINUTES = 5 * 60 * 1000;

/** Tells whether the browser can reach the network right now. */
function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    const on = () => setOnline(true);
    const off = () => setOnline(false);

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

/** The people in a conversation, plus everyone else, for mentions. */
export function usePeople() {
  const trpc = useTrpcClient();
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    let live = true;

    trpc.chat.people
      .query()
      .then((rows) => live && setPeople(rows))
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [trpc]);

  return people;
}

/** One conversation: header, messages, composer and its thread. */
export function ChannelView({ name, id }: { name?: string; id?: string }) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const search = useSearchParams();
  const sidebar = useChatSidebar();
  const online = useOnline();
  const people = usePeople();
  const canUpload = usePermission("chat.files.upload");
  const anchor = search.get("m");

  const [channel, setChannel] = useState<
    ChannelData | Extract<Outputs["chat"]["get"], { access: "none" }> | null
  >(null);
  const [error, setError] = useState<"missing" | "failed" | null>(null);
  const [messages, setMessages] = useState<MessageView[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [local, setLocal] = useState<Local[]>([]);
  const [thread, setThread] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [preview, setPreview] = useState<{
    file: AttachmentView;
    all: AttachmentView[];
  } | null>(null);
  const [taskFrom, setTaskFrom] = useState<MessageView | null>(null);
  const [highlight, setHighlight] = useState<string | null>(anchor);
  const [retryIn, setRetryIn] = useState(8);
  const list = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const channelId = channel?.id;

  const loadChannel = useCallback(async () => {
    try {
      setChannel(await trpc.chat.get.query(id ? { id } : { name }));
      setError(null);
    } catch (caught) {
      const code = (caught as { data?: { code?: string } }).data?.code;

      setError(code === "NOT_FOUND" ? "missing" : "failed");
    }
  }, [trpc, id, name]);

  useEffect(() => {
    setChannel(null);
    setMessages(null);
    setLocal([]);
    setThread(null);
    setError(null);
    void loadChannel();
  }, [loadChannel]);

  const full = channel?.access === "full" ? channel : null;

  /** The newest page, merged over what is already loaded. */
  const refresh = useCallback(
    async (initial = false) => {
      if (!channelId || !full) return;

      try {
        const data = await trpc.chat.messages.query(
          initial && anchor ? { channelId, aroundId: anchor } : { channelId },
        );

        setLoadError(false);
        setMessages((current) => {
          if (!current || initial) {
            setHasMore(data.hasMore);

            return data.messages;
          }

          const byId = new Map(current.map((message) => [message.id, message]));

          for (const message of data.messages) byId.set(message.id, message);

          return [...byId.values()].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });
      } catch {
        setLoadError(true);
      }
    },
    [trpc, channelId, full, anchor],
  );

  useEffect(() => {
    if (full) void refresh(true);
    // Only the first load around an anchor; polling merges afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, full === null]);

  useEffect(() => {
    if (!full) return;

    const id = setInterval(() => void refresh(), 4000);

    return () => clearInterval(id);
  }, [full, refresh]);

  // Reconnect countdown for the offline banner.
  useEffect(() => {
    if (online && !loadError) return;

    setRetryIn(8);

    const id = setInterval(() => {
      setRetryIn((value) => {
        if (value <= 1) {
          void refresh();

          return 8;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [online, loadError, refresh]);

  const offline = !online;

  // Mark what's on screen as read, and tell the sidebar.
  const lastCount = useRef(0);

  useEffect(() => {
    if (!channelId || !messages || !full?.joined) return;
    if (messages.length === lastCount.current) return;

    lastCount.current = messages.length;

    if (document.visibilityState === "visible") {
      void trpc.chat.markRead
        .mutate({ channelId })
        .then(() => sidebar.refresh())
        .catch(() => undefined);
    }
  }, [messages, channelId, full?.joined, trpc, sidebar]);

  // Keep the view at the bottom while you're there; jump to an anchor.
  useEffect(() => {
    const element = list.current;

    if (!element || !messages) return;

    if (anchor) {
      document
        .getElementById(`message-${anchor}`)
        ?.scrollIntoView({ block: "center" });

      return;
    }

    if (stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [messages, local, anchor]);

  useEffect(() => {
    if (!highlight) return;

    const timer = setTimeout(() => setHighlight(null), 4000);

    return () => clearTimeout(timer);
  }, [highlight]);

  const loadOlder = async () => {
    if (!channelId || !messages?.length) return;

    const first = messages[0]!;
    const previousHeight = list.current?.scrollHeight ?? 0;
    const data = await trpc.chat.messages.query({
      channelId,
      before: first.createdAt,
    });

    stickToBottom.current = false;
    setMessages((current) => [...data.messages, ...(current ?? [])]);
    setHasMore(data.hasMore);
    requestAnimationFrame(() => {
      if (list.current) {
        list.current.scrollTop = list.current.scrollHeight - previousHeight;
      }
    });
  };

  /** Sends now when online; otherwise keeps it and sends on reconnect. */
  const deliver = useCallback(
    async (item: Local) => {
      if (!channelId) return;

      if (!navigator.onLine) {
        setLocal((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? { ...entry, state: "queued" }
              : entry,
          ),
        );

        return;
      }

      setLocal((current) =>
        current.map((entry) =>
          entry.localId === item.localId
            ? { ...entry, state: "sending" }
            : entry,
        ),
      );

      try {
        await trpc.chat.send.mutate({
          channelId,
          body: item.draft.body,
          fileIds: item.draft.fileIds,
          parentId: item.parentId,
          clientId: item.localId,
        });
        setLocal((current) =>
          current.filter((entry) => entry.localId !== item.localId),
        );
        await refresh();
        void sidebar.refresh();
      } catch {
        setLocal((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? { ...entry, state: navigator.onLine ? "failed" : "queued" }
              : entry,
          ),
        );
      }
    },
    [trpc, channelId, refresh, sidebar],
  );

  useEffect(() => {
    if (!online) return;

    for (const item of local.filter((entry) => entry.state === "queued")) {
      void deliver(item);
    }
    // Queued messages go out once the network is back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const me = people.find((person) => person.isMe);
  const meId = me?.memberId ?? "";

  const send = async (draft: Draft) => {
    if (!channelId || !me) return;

    const localId = crypto.randomUUID();
    const view: MessageView = {
      id: `local-${localId}`,
      channelId,
      parentId: null,
      clientId: localId,
      author: { memberId: me.memberId, name: me.name, presence: "active" },
      mine: true,
      body: draft.body,
      createdAt: new Date(),
      editedAt: null,
      deleted: false,
      pinned: false,
      names: {},
      reactions: [],
      attachments: [],
      tasks: [],
      replies: null,
    };
    const item: Local = { localId, state: "sending", draft, view };

    stickToBottom.current = true;
    setLocal((current) => [...current, item]);
    await deliver(item);
  };

  const run = async (action: () => Promise<unknown>, fail: string) => {
    try {
      await action();
      await refresh();
    } catch (caught) {
      toastError(caught, fail);
    }
  };

  const actions: MessageActions = {
    onReply: (message) => setThread(message.id),
    onReact: (message, emoji) =>
      void run(
        () => trpc.chat.react.mutate({ messageId: message.id, emoji }),
        "Could not react",
      ),
    onPin: (message) =>
      void run(async () => {
        await trpc.chat.pin.mutate({
          messageId: message.id,
          pinned: !message.pinned,
        });
        await loadChannel();
      }, "Could not pin the message"),
    onEdit: (message, body) =>
      run(
        () => trpc.chat.edit.mutate({ messageId: message.id, body }),
        "Could not edit the message",
      ),
    onDelete: (message) =>
      void run(
        () => trpc.chat.remove.mutate({ messageId: message.id }),
        "Could not delete the message",
      ),
    onCreateTask: (message) => setTaskFrom(message),
    onOpenFile: (file, all) => setPreview({ file, all }),
    onRetry: (message) => {
      const item = local.find((entry) => entry.view.id === message.id);

      if (item) void deliver(item);
    },
    onDiscard: (message) =>
      setLocal((current) =>
        current.filter((entry) => entry.view.id !== message.id),
      ),
  };

  const rows = useMemo(() => {
    const all: Array<{ message: MessageView; local?: LocalState }> = [
      ...(messages ?? []).map((message) => ({ message })),
      ...local
        .filter((item) => !item.parentId)
        .map((item) => ({ message: item.view, local: item.state })),
    ];

    return all;
  }, [messages, local]);

  if (error === "missing") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-serif-italic text-[2rem] leading-10">
          That channel isn’t here.
        </p>
        <p className="max-w-sm text-[15px] text-ink-2">
          It may have been renamed or removed. Pick another from the list, or
          browse the channels you can join.
        </p>
        <Button asChild variant="outline">
          <Link href="/chat">Back to Chat</Link>
        </Button>
      </div>
    );
  }

  if (error === "failed" && !channel) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex size-10 items-center justify-center rounded-full border border-danger text-danger-text">
          !
        </span>
        <p className="text-lg font-semibold">
          We couldn’t load {name ? `#${name}` : "this conversation"}.
        </p>
        <p className="max-w-sm text-[15px] text-ink-2">
          Your messages are safe on the server. Other channels still work. Try
          again in a moment.
        </p>
        <Button variant="outline" onClick={() => void loadChannel()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-1 flex-col" aria-busy="true">
        <div className="flex items-center gap-3 border-b border-hairline px-5 py-3.5">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-1 flex-col gap-5 px-5 py-6">
          {[70, 45, 80, 55, 62].map((width, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3" style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
          <p className="font-mono text-xs text-ink-3">
            Loading {name ? `#${name}` : "conversation"}…
          </p>
        </div>
      </div>
    );
  }

  if (channel.access === "none") {
    return <NoAccessView channel={channel} />;
  }

  const data = channel;
  const isDm = data.kind === "dm";
  const others = data.people.filter((person) => person.memberId !== meId);
  const canPost = data.canPost;

  return (
    <div className="flex min-h-0 flex-1">
      <section
        aria-label={isDm ? data.title : `#${data.name}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        <header className="flex items-center gap-3 border-b border-hairline px-5 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-tint-teams">
            {isDm ? (
              others[0] ? (
                <Avatar
                  name={others[0].name}
                  presence={others[0].presence}
                  size={28}
                />
              ) : null
            ) : data.visibility === "private" ? (
              <LockIcon className="size-4" aria-hidden="true" />
            ) : (
              <HashIcon className="size-4" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg leading-6 font-semibold">
                {isDm ? data.title : data.name}
              </h2>
              {data.link ? (
                <Link
                  href={data.link.href}
                  className="flex items-center gap-1.5 text-[13px] text-signal-strong hover:underline"
                >
                  {data.link.key ? (
                    <span className="rounded-xs border border-hairline px-1 font-mono text-[10px] text-ink-2">
                      {data.link.key}
                    </span>
                  ) : null}
                  {data.link.name}
                </Link>
              ) : null}
              {data.archivedAt ? (
                <span className="rounded-sm border border-hairline px-1.5 font-mono text-[10px] text-ink-2 uppercase">
                  Archived
                </span>
              ) : null}
            </div>
            {!isDm ? (
              <p className="truncate text-[13px] text-ink-2">
                {data.topic || "No topic yet"}
              </p>
            ) : null}
          </div>

          {!isDm ? (
            <button
              type="button"
              onClick={() => setSettings(true)}
              aria-label={`${data.people.length} members`}
              className="hidden items-center gap-2 rounded-full border border-hairline px-2 py-1 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring sm:flex"
            >
              <span className="flex">
                {data.people.slice(0, 3).map((person) => (
                  <span
                    key={person.memberId}
                    className="-ml-1.5 rounded-full ring-2 ring-canvas first:ml-0"
                  >
                    <Avatar name={person.name} size={20} />
                  </span>
                ))}
              </span>
              <span className="font-mono text-xs text-ink-2">
                {data.people.length}
              </span>
            </button>
          ) : null}
          <PinsButton
            channelId={data.id}
            count={data.pinCount}
            onJump={(messageId) => router.replace(`?m=${messageId}`)}
          />
          <NotifyButton channel={data} onChanged={() => void loadChannel()} />
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            aria-label="Search this channel"
          >
            <Link href={`/chat/search?in=${data.id}`}>
              <SearchIcon className="size-4" />
            </Link>
          </Button>
          {!isDm ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Channel settings"
              onClick={() => setSettings(true)}
            >
              <SettingsIcon className="size-4" />
            </Button>
          ) : null}
        </header>

        {offline || loadError ? (
          <div
            role="status"
            className="flex items-center gap-3 border-b border-hairline bg-surface px-5 py-2 text-[13px]"
          >
            <WifiOffIcon className="size-4 text-ink-3" aria-hidden="true" />
            <span className="flex-1">
              <strong className="font-semibold">
                {offline ? "You’re offline." : "Can’t reach the server."}
              </strong>{" "}
              <span className="text-ink-2">
                Messages you send stay on this device and go out when you
                reconnect.
              </span>
            </span>
            <span className="hidden font-mono text-xs text-ink-3 sm:block">
              Reconnecting in {retryIn}s
            </span>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Retry now
            </Button>
          </div>
        ) : null}

        <div
          ref={list}
          onScroll={(event) => {
            const element = event.currentTarget;

            stickToBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              80;
          }}
          className="min-h-0 flex-1 overflow-y-auto py-2"
        >
          {messages === null ? (
            loadError ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-10 items-center justify-center rounded-full border border-danger text-danger-text">
                  !
                </span>
                <p className="text-lg font-semibold">
                  We couldn’t load {isDm ? data.title : `#${data.name}`}.
                </p>
                <p className="max-w-sm text-[15px] text-ink-2">
                  Your messages are safe on the server. Other channels still
                  work. Try again in a moment.
                </p>
                <Button variant="outline" onClick={() => void refresh(true)}>
                  Try again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 px-5 py-4" aria-busy="true">
                {[70, 45, 80, 55, 62, 40].map((width, index) => (
                  <div key={index} className="flex gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton
                        className="h-3"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="font-mono text-xs text-ink-3">
                  Loading {isDm ? data.title : `#${data.name}`}…
                </p>
              </div>
            )
          ) : rows.length === 0 ? (
            <EmptyChannel data={data} onSettings={() => setSettings(true)} />
          ) : (
            <>
              {hasMore ? (
                <div className="flex justify-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadOlder()}
                  >
                    Load earlier messages
                  </Button>
                </div>
              ) : (
                <IntroNote data={data} />
              )}
              {rows.map(({ message, local: state }, index) => {
                const previous = rows[index - 1]?.message;
                const sameDay =
                  previous &&
                  new Date(previous.createdAt).toDateString() ===
                    new Date(message.createdAt).toDateString();
                const grouped =
                  Boolean(sameDay) &&
                  previous!.author?.memberId === message.author?.memberId &&
                  !previous!.deleted &&
                  new Date(message.createdAt).getTime() -
                    new Date(previous!.createdAt).getTime() <
                    FIVE_MINUTES &&
                  message.attachments.length === 0;

                return (
                  <div key={message.id}>
                    {!sameDay ? (
                      <div className="flex items-center gap-3 px-5 pt-4 pb-1">
                        <span
                          aria-hidden="true"
                          className="h-px flex-1 bg-hairline"
                        />
                        <span className="font-mono text-[11px] text-ink-3">
                          {dayHeading(message.createdAt)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="h-px flex-1 bg-hairline"
                        />
                      </div>
                    ) : null}
                    <MessageItem
                      message={message}
                      meId={meId}
                      grouped={grouped}
                      highlighted={highlight === message.id}
                      canPost={canPost}
                      canModerate={data.canManage}
                      local={state}
                      actions={actions}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="px-5 pt-1 pb-4">
          <Composer
            placeholder={
              isDm ? `Message ${data.title}` : `Message #${data.name}`
            }
            people={people}
            canAttach={canUpload && canPost}
            disabled={!canPost}
            disabledNote={
              data.archivedAt
                ? "This channel is archived. Messages and files are kept, but nobody can post."
                : "You can read this channel but not post in it."
            }
            offline={offline}
            onSend={send}
            autoFocus
          />
        </div>
      </section>

      {thread ? (
        <div className="hidden w-[380px] shrink-0 lg:block">
          <ThreadPanel
            messageId={thread}
            channelName={isDm ? data.title : data.name}
            meId={meId}
            people={people}
            canPost={canPost}
            canAttach={canUpload && canPost}
            offline={offline}
            actions={actions}
            onClose={() => setThread(null)}
            onChanged={() => void refresh()}
          />
        </div>
      ) : null}

      {thread ? (
        <div className="fixed inset-0 z-40 bg-canvas lg:hidden">
          <ThreadPanel
            messageId={thread}
            channelName={isDm ? data.title : data.name}
            meId={meId}
            people={people}
            canPost={canPost}
            canAttach={canUpload && canPost}
            offline={offline}
            actions={actions}
            onClose={() => setThread(null)}
            onChanged={() => void refresh()}
          />
        </div>
      ) : null}

      {settings ? (
        <ChannelSettingsDialog
          channel={data}
          people={people}
          onClose={() => setSettings(false)}
          onChanged={() => {
            void loadChannel();
            void sidebar.refresh();
          }}
        />
      ) : null}

      {preview ? (
        <FilePreviewDialog
          file={preview.file}
          all={preview.all}
          onClose={() => setPreview(null)}
        />
      ) : null}

      {taskFrom ? (
        <CreateTaskModal
          key={taskFrom.id}
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) setTaskFrom(null);
          }}
          defaultName={taskFrom.body
            .replace(/<@[0-9a-f-]{36}>/g, "")
            .replace(/<!(?:channel|here)>/g, "")
            .trim()
            .slice(0, 100)}
          linkMessageId={taskFrom.id}
          onTaskCreated={() => {
            setTaskFrom(null);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function IntroNote({ data }: { data: ChannelData }) {
  return (
    <p className="px-5 pt-3 pb-2 font-mono text-[11px] text-ink-3">
      {data.kind === "dm"
        ? `This is the start of your conversation with ${data.title}.`
        : `This is the start of #${data.name}.`}
    </p>
  );
}

function EmptyChannel({
  data,
  onSettings,
}: {
  data: ChannelData;
  onSettings: () => void;
}) {
  const dm = data.kind === "dm";

  return (
    <div className="flex flex-col gap-3 px-8 py-10">
      <span className="flex size-12 items-center justify-center rounded-lg bg-tint-teams">
        {dm ? (
          <Avatar name={data.title} size={32} />
        ) : (
          <HashIcon className="size-6" aria-hidden="true" />
        )}
      </span>
      <h3 className="font-display text-[1.75rem] leading-9">
        {dm
          ? `Start a conversation with ${data.title}.`
          : `This is the start of #${data.name}.`}
      </h3>
      <p className="max-w-lg text-[15px] leading-[22px] text-ink-2">
        {dm
          ? "Messages here are only visible to the two of you."
          : data.link?.type === "project"
            ? `Created and linked to ${data.link.name}. Any ${data.link.key} key you mention here turns into a link to its task, and the channel shows up under Project channels.`
            : "Say hello, ask a question or share what you’re working on. Mention a task key like ZEN-18 and it links both ways."}
      </p>
      {!dm && data.canManage ? (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          <Button variant="outline" size="sm" onClick={onSettings}>
            Add people
          </Button>
          <Button variant="outline" size="sm" onClick={onSettings}>
            Set a topic
          </Button>
          <span className="font-mono text-xs text-ink-3">
            {data.people.length}{" "}
            {data.people.length === 1 ? "member" : "members"} ·{" "}
            {data.visibility === "private" ? "Private" : "Public"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** The pinned messages of the channel. */
function PinsButton({
  channelId,
  count,
  onJump,
}: {
  channelId: string;
  count: number;
  onJump: (messageId: string) => void;
}) {
  const trpc = useTrpcClient();
  const [open, setOpen] = useState(false);
  const [pins, setPins] = useState<MessageView[] | null>(null);

  useEffect(() => {
    if (!open) return;

    setPins(null);
    void trpc.chat.pins.query({ channelId }).then(setPins);
  }, [open, channelId, trpc]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-ink-2"
          aria-label={`${count} pinned messages`}
        >
          <PinIcon className="size-4" />
          <span className="font-mono text-xs">{count}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-1 p-2">
        <p className="eyebrow px-2 pt-1 pb-1.5">Pinned</p>
        {pins === null ? (
          <Skeleton className="m-2 h-10" />
        ) : pins.length === 0 ? (
          <p className="px-2 py-3 text-sm text-ink-2">
            Nothing pinned yet. Pin a message from its menu to keep it here.
          </p>
        ) : (
          pins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onJump(pin.id);
              }}
              className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-hover"
            >
              <span className="text-xs font-semibold">
                {pin.author?.name}{" "}
                <span className="font-mono font-normal text-ink-3">
                  {messageTime(pin.createdAt)}
                </span>
              </span>
              <span className="line-clamp-2 text-sm">
                <MessageBody body={pin.body} names={pin.names} />
              </span>
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Notification settings for this conversation. */
function NotifyButton({
  channel,
  onChanged,
}: {
  channel: ChannelData;
  onChanged: () => void;
}) {
  const trpc = useTrpcClient();
  const [open, setOpen] = useState(false);
  const muted =
    channel.notify === "mute" ||
    Boolean(channel.mutedUntil && new Date(channel.mutedUntil) > new Date());

  const save = async (values: {
    notify?: "all" | "mentions" | "mute";
    notifyReplies?: boolean;
    mutedUntil?: Date | null;
  }) => {
    try {
      await trpc.chat.setPreferences.mutate({
        channelId: channel.id,
        ...values,
      });
      onChanged();
    } catch (error) {
      toastError(error, "Could not save that");
    }
  };

  if (!channel.joined) return null;

  const tomorrow = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);

    return date;
  };
  const options = [
    ["all", "All new messages", "Badge and notify for every message."],
    ["mentions", "Mentions only", "@you, @channel, @here and replies to you."],
    [
      "mute",
      "Mute",
      "No badges or notifications. Mentions still land in Mentions.",
    ],
  ] as const;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notification settings"
          className={cn(muted && "text-ink-3")}
        >
          {muted ? (
            <BellOffIcon className="size-4" />
          ) : (
            <BellIcon className="size-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-1 p-2">
        <p className="px-2 pt-1 pb-1 text-sm font-semibold">
          Notifications for{" "}
          {channel.kind === "dm" ? channel.title : `#${channel.name}`}
        </p>
        {options.map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={channel.notify === value}
            onClick={() => void save({ notify: value })}
            className={cn(
              "flex items-start gap-2.5 rounded-md px-2 py-2 text-left hover:bg-hover",
              channel.notify === value && "bg-hover",
            )}
          >
            <span
              className={cn(
                "mt-0.5 size-4 shrink-0 rounded-full border",
                channel.notify === value
                  ? "border-[5px] border-ink"
                  : "border-line-strong",
              )}
            />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-ink-2">{hint}</span>
            </span>
          </button>
        ))}
        <label className="flex items-center gap-3 border-t border-hairline px-2 pt-3 pb-1 text-sm">
          <span className="flex-1">Replies to my messages</span>
          <input
            type="checkbox"
            checked={channel.notifyReplies}
            onChange={(event) =>
              void save({ notifyReplies: event.target.checked })
            }
            className="size-4 accent-[var(--signal)]"
          />
        </label>
        <label className="flex items-center gap-3 px-2 py-1 text-sm">
          <span className="flex-1">Mute until tomorrow 09:00</span>
          <input
            type="checkbox"
            checked={Boolean(
              channel.mutedUntil && new Date(channel.mutedUntil) > new Date(),
            )}
            onChange={(event) =>
              void save({
                mutedUntil: event.target.checked ? tomorrow() : null,
              })
            }
            className="size-4 accent-[var(--signal)]"
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}
