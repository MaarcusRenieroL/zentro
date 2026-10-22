"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3Icon,
  BellIcon,
  BellOffIcon,
  HashIcon,
  LockIcon,
  MoreHorizontalIcon,
  PinIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  VideoIcon,
  WifiOffIcon,
} from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";
import { usePermission } from "~/src/components/permissions/permission-provider";

import { ChannelInfoBar, TypingLine } from "./channel-extras";
import { ChannelSettingsDialog } from "./channel-settings-dialog";
import {
  EmojiManagerDialog,
  ForwardDialog,
  PollDialog,
  SummaryDialog,
} from "./chat-dialogs-extra";
import { useChatSidebar } from "./chat-store";
import {
  Composer,
  type Draft,
  type Person,
  type SlashCommand,
} from "./composer";
import { FilePreviewDialog } from "./file-preview";
import {
  dayHeading,
  MessageBody,
  messageTime,
  untilLabel,
} from "./message-body";
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

/** "30m", "2h", "tomorrow", "monday": when a command should happen. */
function parseWhen(word: string): Date | null {
  const lower = word.toLowerCase();
  const relative = /^(\d{1,3})(m|min|h|hr)$/.exec(lower);

  if (relative) {
    const amount = Number(relative[1]);

    return new Date(
      Date.now() + amount * (relative[2]!.startsWith("h") ? 3_600_000 : 60_000),
    );
  }

  const date = new Date();

  if (lower === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);

    return date;
  }

  if (lower === "monday") {
    date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7));
    date.setHours(9, 0, 0, 0);

    return date;
  }

  return null;
}

const slugOf = (title: string) =>
  `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "doc"
  }-${Math.random().toString(36).slice(2, 6)}`;

/** A message body as plain text, with mentions written as names. */
function plainText(body: string, names: Record<string, string>) {
  return body
    .replace(
      /<@([0-9a-f-]{36})>/g,
      (_, id: string) => `@${names[id] ?? "someone"}`,
    )
    .replace(/<!(channel|here)>/g, "@$1");
}

function localView(
  base: Pick<MessageView, "id" | "channelId" | "clientId" | "body"> & {
    author: { memberId: string; name: string };
  },
): MessageView {
  return {
    ...base,
    parentId: null,
    kind: "message",
    meta: null,
    author: { ...base.author, presence: "active", status: null },
    saved: null,
    poll: null,
    forwarded: null,
    entities: [],
    links: [],
    mine: true,
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
  const [forwardOf, setForwardOf] = useState<MessageView | null>(null);
  const [summary, setSummary] = useState(false);
  const [poll, setPoll] = useState<{
    question: string;
    options?: string[];
  } | null>(null);
  const [emojiManager, setEmojiManager] = useState(false);
  const [newTask, setNewTask] = useState<string | null>(null);
  const [typers, setTypers] = useState<string[]>([]);
  const [readers, setReaders] = useState<
    Array<{ memberId: string; name: string; lastReadAt: Date | string }>
  >([]);
  // When the person last read this conversation, from before they opened it.
  const [readMark, setReadMark] = useState<Date | null>(null);
  const readMarkFor = useRef<string | null>(null);
  const scrolledToUnread = useRef(false);
  const unfurled = useRef(new Set<string>());
  const lastTyping = useRef(0);
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
    setReadMark(null);
    setTypers([]);
    setReaders([]);
    readMarkFor.current = null;
    scrolledToUnread.current = false;
    void loadChannel();
  }, [loadChannel]);

  const full = channel?.access === "full" ? channel : null;

  // A link like ?thread=<id> opens that thread beside the conversation.
  const threadParam = search.get("thread");

  useEffect(() => {
    if (full && threadParam) setThread(threadParam);
    // Only when the link or the conversation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full?.id, threadParam]);

  // Remember where the person had read up to, before opening marks it read.
  useEffect(() => {
    if (!full || readMarkFor.current === full.id) return;

    readMarkFor.current = full.id;
    setReadMark(
      full.joined && full.lastReadAt ? new Date(full.lastReadAt) : null,
    );
  }, [full]);

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

    // Opening a conversation with unread messages lands on the first one.
    const divider = document.getElementById("unread-divider");

    if (divider && !scrolledToUnread.current) {
      scrolledToUnread.current = true;
      stickToBottom.current = false;
      divider.scrollIntoView({ block: "start" });

      return;
    }

    if (stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [messages, local, anchor, readMark]);

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

  // Who is typing, and who has read what: light polling while this is open.
  useEffect(() => {
    if (!channelId || !full) return;

    let live = true;
    const poll = () => {
      if (document.visibilityState !== "visible") return;

      trpc.chat.typingNow
        .query({ channelId })
        .then((names) => live && setTypers(names))
        .catch(() => undefined);
    };
    const id = setInterval(poll, 3000);

    return () => {
      live = false;
      clearInterval(id);
    };
  }, [trpc, channelId, full]);

  useEffect(() => {
    if (!channelId || !full) return;

    let live = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;

      trpc.chat.readState
        .query({ channelId })
        .then((rows) => live && setReaders(rows))
        .catch(() => undefined);
    };

    load();

    const id = setInterval(load, 8000);

    return () => {
      live = false;
      clearInterval(id);
    };
  }, [trpc, channelId, full]);

  // Fetch previews for links in messages that have none yet, once each.
  useEffect(() => {
    if (!messages) return;

    const pending = messages.filter(
      (message) =>
        !message.deleted &&
        !message.links.length &&
        /https?:\/\/[^\s<]+/.test(message.body) &&
        !unfurled.current.has(message.id) &&
        !message.id.startsWith("local-"),
    );

    if (!pending.length) return;

    for (const message of pending) unfurled.current.add(message.id);

    void Promise.all(
      pending.slice(0, 5).map((message) =>
        trpc.chat.unfurl.mutate({ messageId: message.id }).catch(() => ({
          fetched: 0,
        })),
      ),
    ).then((results) => {
      if (results.some((result) => result.fetched > 0)) void refresh();
    });
  }, [messages, trpc, refresh]);

  const typed = () => {
    if (!channelId || Date.now() - lastTyping.current < 3000) return;

    lastTyping.current = Date.now();
    void trpc.chat.typing.mutate({ channelId }).catch(() => undefined);
  };

  const send = async (draft: Draft) => {
    if (!channelId || !me) return;

    const localId = crypto.randomUUID();
    const view = localView({
      id: `local-${localId}`,
      channelId,
      clientId: localId,
      body: draft.body,
      author: { memberId: me.memberId, name: me.name },
    });
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

  /** Starts a doc from a message and its thread, then opens it. */
  const makeDoc = async (message: MessageView) => {
    try {
      const replies =
        message.replies && message.replies.count > 0
          ? (await trpc.chat.thread.query({ messageId: message.id })).replies
          : [];
      const first = plainText(message.body, message.names).split("\n")[0] ?? "";
      const title = first.trim().slice(0, 80) || "Notes from chat";
      const where = full?.kind === "dm" ? "a direct message" : `#${full?.name}`;
      const line = (entry: MessageView) =>
        `**${entry.author?.name ?? "Someone"}** (${new Date(entry.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}): ${plainText(entry.body, entry.names)}`;
      const content = [
        `# ${title}`,
        `_From ${where}. ${window.location.origin}/chat/${full?.kind === "dm" ? `dm/${channelId}` : full?.name}?m=${message.id}_`,
        "",
        line(message),
        ...replies.map(line),
      ].join("\n\n");
      const slug = slugOf(title);

      await trpc.docs.create.mutate({ title, content, slug });
      toastSuccess("Doc created");
      router.push(`/docs/${slug}`);
    } catch (error) {
      toastError(error, "Could not create the doc");
    }
  };

  const postPlain = async (body: string) => {
    if (!channelId) return;

    await trpc.chat.send.mutate({
      channelId,
      body,
      clientId: crypto.randomUUID(),
      fileIds: [],
    });
    await refresh();
    void sidebar.refresh();
  };

  const commands: SlashCommand[] = [
    {
      name: "task",
      usage: "<title>",
      description: "Create a task",
      run: (args) => setNewTask(args),
    },
    {
      name: "doc",
      usage: "<title>",
      description: "Create a doc and share it here",
      run: async (args) => {
        const title = args || "Untitled";
        const slug = slugOf(title);

        await trpc.docs.create.mutate({ title, content: "", slug });
        await postPlain(
          `Created a doc: ${window.location.origin}/docs/${slug}`,
        );
        toastSuccess("Doc created and shared");
      },
    },
    {
      name: "poll",
      usage: "Question | option | option",
      description: "Ask the channel to vote",
      run: async (args) => {
        const [question = "", ...options] = args
          .split("|")
          .map((part) => part.trim());
        const filled = options.filter(Boolean);

        if (question && filled.length >= 2 && channelId) {
          await trpc.chat.createPoll.mutate({
            channelId,
            question,
            options: filled.slice(0, 8),
          });
          await refresh();
        } else {
          setPoll({ question, options: filled.length ? filled : undefined });
        }
      },
    },
    {
      name: "huddle",
      usage: "",
      description: "Start a video huddle",
      run: async () => {
        if (!channelId) return;

        const { url } = await trpc.chat.startHuddle.mutate({ channelId });

        await refresh();
        window.open(url, "_blank", "noopener");
      },
    },
    {
      name: "summarize",
      usage: "",
      description: "Summarize recent messages",
      run: () => setSummary(true),
    },
    {
      name: "schedule",
      usage: "<30m|2h|tomorrow|monday> <message>",
      description: "Send a message later",
      run: async (args) => {
        const [when = "", ...rest] = args.split(/\s+/);
        const at = parseWhen(when);
        const body = rest.join(" ").trim();

        if (!at || !body || !channelId) {
          throw new Error(
            "Use /schedule 30m <message>, or 2h, tomorrow, monday.",
          );
        }

        await trpc.chat.schedule.mutate({ channelId, body, sendAt: at });
        toastSuccess(`Scheduled for ${untilLabel(at)}`);
        void sidebar.refresh();
      },
    },
    {
      name: "status",
      usage: "<emoji> <text>",
      description: "Set your status",
      run: async (args) => {
        const match = /^(\p{Extended_Pictographic}\S*)?\s*(.*)$/u.exec(args);

        await trpc.chat.statusSet.mutate({
          emoji: match?.[1] ?? null,
          text: match?.[2]?.trim() || null,
          clearInMinutes: null,
          dndMinutes: null,
        });
        toastSuccess(args ? "Status updated" : "Status cleared");
      },
    },
    {
      name: "dnd",
      usage: "<30m|2h|off>",
      description: "Pause notifications",
      run: async (args) => {
        const until = parseWhen(args);

        await trpc.chat.statusSet.mutate({
          emoji: null,
          text: null,
          clearInMinutes: null,
          dndMinutes:
            args === "off" || !until
              ? 0
              : Math.max(
                  1,
                  Math.round((until.getTime() - Date.now()) / 60_000),
                ),
        });
        await sidebar.refresh();
        toastSuccess(
          args === "off" || !until
            ? "Do not disturb is off"
            : "Do not disturb is on",
        );
      },
    },
    {
      name: "assign",
      usage: "[TASK-KEY] @person",
      description: "Assign a task",
      run: async (args) => {
        // In a task's own discussion the key is the task itself.
        const key =
          /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/.exec(args)?.[0] ??
          (full?.link?.type === "task" ? full.link.key : null);
        const who = /<@([0-9a-f-]{36})>/.exec(args)?.[1];

        if (!key || !who) throw new Error("Use /assign MA-6 @person.");

        await trpc.task.updateTaskByKey.mutate({
          key,
          assignedToMemberId: who,
        });
        toastSuccess(`${key} assigned`);
        await postPlain(
          `assigned ${key} to ${args.replace(/\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/, "").trim()}`,
        );
      },
    },
    {
      name: "done",
      usage: "[TASK-KEY]",
      description: "Mark a task done",
      run: async (args) => {
        const key =
          /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/.exec(args)?.[0] ??
          (full?.link?.type === "task" ? full.link.key : null);

        if (!key) throw new Error("Use /done MA-6.");

        await trpc.task.updateTaskByKey.mutate({ key, status: "done" });
        toastSuccess(`${key} marked done`);
      },
    },
    {
      name: "shrug",
      usage: "[message]",
      description: "Add ¯\\_(ツ)_/¯",
      run: (args) => postPlain(`${args} ¯\\_(ツ)_/¯`.trim()),
    },
  ];

  const schedule = async (draft: Draft, at: Date) => {
    if (!channelId) return;

    try {
      await trpc.chat.schedule.mutate({
        channelId,
        body: draft.body,
        sendAt: at,
      });
      toastSuccess(`Scheduled for ${untilLabel(at)}`);
      void sidebar.refresh();
    } catch (error) {
      toastError(error, "Could not schedule the message");
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
    onSave: (message, saved) =>
      void run(async () => {
        await trpc.chat.saveMessage.mutate({ messageId: message.id, saved });
        toastSuccess(saved ? "Saved for later" : "Removed from saved");
        void sidebar.refresh();
      }, "Could not save the message"),
    onRemind: (message, at) =>
      void run(async () => {
        await trpc.chat.setReminder.mutate({
          messageId: message.id,
          remindAt: at,
        });
        toastSuccess(
          at ? `I’ll remind you ${untilLabel(at)}` : "Reminder cleared",
        );
        void sidebar.refresh();
      }, "Could not set the reminder"),
    onMarkUnread: (message) =>
      void run(async () => {
        if (!channelId) return;

        await trpc.chat.markUnread.mutate({
          channelId,
          messageId: message.id,
        });
        setReadMark(new Date(new Date(message.createdAt).getTime() - 1));
        scrolledToUnread.current = true;
        lastCount.current = messages?.length ?? 0;
        void sidebar.refresh();
        toastSuccess("Marked unread from this message");
      }, "Could not mark it unread"),
    onForward: (message) => setForwardOf(message),
    onVote: (pollId, optionIndex) =>
      void run(
        () => trpc.chat.votePoll.mutate({ pollId, optionIndex }),
        "Could not record your vote",
      ),
    onClosePoll: (pollId) =>
      void run(
        () => trpc.chat.closePoll.mutate({ pollId }),
        "Could not close the poll",
      ),
    onTranslate: async (message, language) =>
      (await trpc.chat.translate.mutate({ messageId: message.id, language }))
        .text,
    onMakeDoc: (message) => void makeDoc(message),
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
  // The first message from someone else that came in since last visit.
  const firstUnread =
    readMark && messages
      ? messages.find(
          (message) =>
            new Date(message.createdAt) > readMark &&
            !message.mine &&
            message.kind !== "event",
        )
      : undefined;
  const lastMine = [...(messages ?? [])]
    .reverse()
    .find((message) => message.mine);
  const seenBy = lastMine
    ? readers
        .filter(
          (reader) =>
            new Date(reader.lastReadAt) >= new Date(lastMine.createdAt),
        )
        .map((reader) => reader.name)
    : [];
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
          {canPost ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Start a huddle"
                title="Start a huddle"
                onClick={() =>
                  void run(async () => {
                    const { url } = await trpc.chat.startHuddle.mutate({
                      channelId: data.id,
                    });

                    window.open(url, "_blank", "noopener");
                  }, "Could not start a huddle")
                }
              >
                <VideoIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Create a poll"
                title="Create a poll"
                onClick={() => setPoll({ question: "" })}
              >
                <BarChart3Icon className="size-4" />
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Summarize this conversation"
            title="Summarize"
            onClick={() => setSummary(true)}
          >
            <SparklesIcon className="size-4" />
          </Button>
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
            className="hidden sm:inline-flex"
            aria-label="Search this channel"
          >
            <Link href={`/chat/search?in=${data.id}`}>
              <SearchIcon className="size-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="sm:hidden"
                aria-label="More channel actions"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {canPost ? (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      void run(async () => {
                        const { url } = await trpc.chat.startHuddle.mutate({
                          channelId: data.id,
                        });

                        window.open(url, "_blank", "noopener");
                      }, "Could not start a huddle")
                    }
                  >
                    <VideoIcon className="size-4" />
                    Start a huddle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPoll({ question: "" })}>
                    <BarChart3Icon className="size-4" />
                    Create a poll
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem onClick={() => setSummary(true)}>
                <SparklesIcon className="size-4" />
                Summarize
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/chat/search?in=${data.id}`}>
                  <SearchIcon className="size-4" />
                  Search this channel
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        {!isDm ? (
          <ChannelInfoBar
            channelId={data.id}
            canvas={data.canvas}
            canEdit={data.joined && canPost}
            onChanged={() => void loadChannel()}
          />
        ) : null}

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
          onKeyDown={(event) => {
            const target = event.target as HTMLElement;

            // Arrow keys walk the messages once one has focus.
            if (!target.matches("[data-message]")) return;

            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              const all = [
                ...event.currentTarget.querySelectorAll<HTMLElement>(
                  "[data-message]",
                ),
              ];
              const next =
                all[all.indexOf(target) + (event.key === "ArrowDown" ? 1 : -1)];

              if (next) {
                event.preventDefault();
                next.focus();
                next.scrollIntoView({ block: "nearest" });
              }
            } else if (event.key === "Escape") {
              document
                .querySelector<HTMLTextAreaElement>(
                  "section[aria-label] textarea[aria-label^='Message']",
                )
                ?.focus();
            }
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
                    {firstUnread?.id === message.id ? (
                      <div
                        id="unread-divider"
                        role="separator"
                        aria-label="New messages"
                        className="flex items-center gap-3 px-5 py-1"
                      >
                        <span
                          aria-hidden="true"
                          className="h-px flex-1 bg-danger"
                        />
                        <span className="font-mono text-[11px] text-danger-text">
                          New
                        </span>
                      </div>
                    ) : null}
                    <MessageItem
                      message={message}
                      meId={meId}
                      grouped={grouped && firstUnread?.id !== message.id}
                      highlighted={highlight === message.id}
                      canPost={canPost}
                      canModerate={data.canManage}
                      local={state}
                      actions={actions}
                    />
                    {lastMine?.id === message.id && seenBy.length && !state ? (
                      <p className="pr-5 text-right font-mono text-[11px] text-ink-3">
                        {isDm && seenBy.length === 1
                          ? "Seen"
                          : `Seen by ${seenBy.slice(0, 3).join(", ")}${seenBy.length > 3 ? ` +${seenBy.length - 3}` : ""}`}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="px-5 pt-0.5 pb-4">
          <TypingLine names={typers} />
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
            onTyped={typed}
            commands={commands}
            draftScope={{ channelId: data.id, key: data.id }}
            onSchedule={schedule}
            onManageEmoji={() => setEmojiManager(true)}
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

      {forwardOf ? (
        <ForwardDialog message={forwardOf} onClose={() => setForwardOf(null)} />
      ) : null}

      {summary ? (
        <SummaryDialog
          channelId={data.id}
          title={isDm ? data.title : `#${data.name}`}
          onClose={() => setSummary(false)}
        />
      ) : null}

      {poll ? (
        <PollDialog
          channelId={data.id}
          initialQuestion={poll.question}
          initialOptions={poll.options}
          onClose={() => setPoll(null)}
          onCreated={() => void refresh()}
        />
      ) : null}

      {emojiManager ? (
        <EmojiManagerDialog
          canManage={data.canManage}
          onClose={() => setEmojiManager(false)}
        />
      ) : null}

      {newTask !== null ? (
        <CreateTaskModal
          key="new-task"
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) setNewTask(null);
          }}
          defaultName={newTask}
          onTaskCreated={() => setNewTask(null)}
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
