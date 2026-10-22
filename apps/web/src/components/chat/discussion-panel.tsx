"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLinkIcon, FileIcon, MessageSquareIcon } from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { useReachable } from "~/src/components/permissions/permission-provider";

import { usePeople } from "./channel-view";
import { Composer, type Draft } from "./composer";
import { CustomEmojiProvider } from "./custom-emoji";
import {
  fileSize,
  MessageBody,
  messageTime,
  relativeAgo,
} from "./message-body";
import { Avatar, type MessageView } from "./message-item";

type Outputs = inferRouterOutputs<AppRouter>["chat"];
type Summary = Extract<Outputs["discussion"], { exists: true }>;

/**
 * The conversation about a task, doc or project, on its own page: who is in
 * it, what was said last, files shared there, and a box to reply. It is made
 * the first time someone starts it.
 */
export function DiscussionPanel({
  type,
  id,
  className,
}: {
  type: "task" | "doc" | "project";
  id: string;
  className?: string;
}) {
  const allowed = useReachable("chat.post");

  if (!allowed) return null;

  return (
    <CustomEmojiProvider>
      <Panel type={type} id={id} className={className} />
    </CustomEmojiProvider>
  );
}

function Panel({
  type,
  id,
  className,
}: {
  type: "task" | "doc" | "project";
  id: string;
  className?: string;
}) {
  const trpc = useTrpcClient();
  const people = usePeople();
  const [summary, setSummary] = useState<
    Summary | { exists: false } | "failed" | null
  >(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [starting, setStarting] = useState(false);
  const channelId =
    summary && summary !== "failed" && summary.exists
      ? summary.channelId
      : null;
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await trpc.chat.discussion.query({ type, id });

      setSummary(data.exists ? data : { exists: false });

      if (data.exists) {
        const page = await trpc.chat.messages.query({
          channelId: data.channelId,
        });

        setMessages(page.messages.slice(-5));
      }
    } catch {
      setSummary("failed");
    }
  }, [trpc, type, id]);

  useEffect(() => {
    void load();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10_000);

    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length]);

  const start = async () => {
    setStarting(true);

    try {
      await trpc.chat.discuss.mutate({ type, id });
      await load();
    } catch (error) {
      toastError(error, "Could not start the discussion");
    } finally {
      setStarting(false);
    }
  };

  const send = async (draft: Draft) => {
    if (!channelId) return;

    try {
      await trpc.chat.send.mutate({
        channelId,
        body: draft.body,
        fileIds: draft.fileIds,
        clientId: crypto.randomUUID(),
      });
      await load();
    } catch (error) {
      toastError(error, "Could not send your message");
    }
  };

  // The panel only makes sense when chat is reachable for this item.
  if (summary === "failed") return null;

  return (
    <section
      aria-label="Discussion"
      className={cn("tile flex flex-col gap-3 p-4", className)}
    >
      <div className="flex items-center gap-2">
        <h2 className="eyebrow">Discussion</h2>
        {summary && summary.exists && summary.unread ? (
          <span className="rounded-full bg-ink px-1.5 font-mono text-[11px] text-ink-inverse">
            {summary.unread} new
          </span>
        ) : null}
        <span className="flex-1" />
        {summary && summary.exists ? (
          <Link
            href={`/chat/${summary.name}`}
            className="flex items-center gap-1 text-[13px] text-signal-strong hover:underline"
          >
            Open in chat
            <ExternalLinkIcon className="size-3" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {summary === null ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !summary.exists ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[13px] leading-5 text-ink-2">
            Talk this through with the people who can see it. Messages stay
            attached here, and task keys, docs and files you mention link both
            ways.
          </p>
          <Button size="sm" loading={starting} onClick={() => void start()}>
            <MessageSquareIcon />
            Start a discussion
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[13px] text-ink-2">
            <span className="flex">
              {summary.people.slice(0, 4).map((name) => (
                <span
                  key={name}
                  title={name}
                  className="-ml-1.5 rounded-full ring-2 ring-surface first:ml-0"
                >
                  <Avatar name={name} size={20} />
                </span>
              ))}
            </span>
            <span>
              {summary.messages}{" "}
              {summary.messages === 1 ? "message" : "messages"}
              {summary.lastAt ? ` · ${relativeAgo(summary.lastAt)}` : ""}
            </span>
          </div>

          {messages.length ? (
            <div
              ref={scroller}
              className="flex max-h-72 flex-col gap-2.5 overflow-y-auto"
            >
              {messages.map((message) => (
                <div key={message.id} className="flex gap-2.5">
                  <Avatar name={message.author?.name ?? "Someone"} size={24} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]">
                      <span className="font-semibold">
                        {message.author?.name ?? "Someone"}
                      </span>{" "}
                      <span className="font-mono text-[11px] text-ink-3">
                        {messageTime(message.createdAt)}
                      </span>
                    </p>
                    <div className="text-[14px] leading-5">
                      <MessageBody
                        body={
                          message.deleted
                            ? "Message deleted."
                            : message.body || "Attachment"
                        }
                        names={message.names}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-3">
              No messages yet. Say something below.
            </p>
          )}

          {summary.files.length ? (
            <ul className="flex flex-col gap-1 border-t border-hairline pt-2">
              {summary.files.map((file) => (
                <li key={file.id}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-2 rounded-sm px-1 py-1 text-[13px] hover:bg-hover"
                  >
                    <FileIcon
                      className="size-3.5 text-ink-3"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {fileSize(file.size)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <Composer
            compact
            placeholder="Add to the discussion…"
            people={people}
            onSend={send}
            draftScope={channelId ? { channelId, key: channelId } : undefined}
          />
        </>
      )}
    </section>
  );
}
