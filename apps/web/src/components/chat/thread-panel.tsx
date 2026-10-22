"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon, BellOffIcon, SparklesIcon, XIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { SummaryDialog } from "./chat-dialogs-extra";
import { Composer, type Draft, type Person } from "./composer";
import { untilLabel } from "./message-body";
import {
  MessageItem,
  type MessageActions,
  type MessageView,
} from "./message-item";

type Thread = { parent: MessageView; replies: MessageView[] };

/** One message and its replies, with a box to answer. */
export function ThreadPanel({
  messageId,
  channelName,
  meId,
  people,
  canPost,
  canAttach,
  offline,
  actions,
  onClose,
  onChanged,
}: {
  messageId: string;
  channelName: string;
  meId: string;
  people: Person[];
  canPost: boolean;
  canAttach: boolean;
  offline: boolean;
  actions: Omit<MessageActions, "onReply">;
  onClose: () => void;
  /** Called after a reply is sent, so the channel can refresh its counts. */
  onChanged: () => void;
}) {
  const trpc = useTrpcClient();
  const [thread, setThread] = useState<Thread | null>(null);
  const [failed, setFailed] = useState(false);
  const [following, setFollowing] = useState(true);
  const [summary, setSummary] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await trpc.chat.thread.query({ messageId });

      setThread(data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc, messageId]);

  useEffect(() => {
    setThread(null);
    count.current = 0;
    void load();

    const id = setInterval(() => void load(), 5000);

    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    let live = true;

    trpc.chat.threadFollowing
      .query({ parentId: messageId })
      .then((data) => live && setFollowing(data.following))
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [trpc, messageId]);

  // Opening a thread, or a reply arriving while it is open, reads it.
  const replyCount = thread?.replies.length;

  useEffect(() => {
    if (replyCount === undefined) return;

    void trpc.chat.markThreadRead
      .mutate({ parentId: messageId })
      .catch(() => undefined);
  }, [trpc, messageId, replyCount]);

  useEffect(() => {
    const replies = thread?.replies.length ?? 0;

    if (replies > count.current) {
      end.current?.scrollIntoView({ block: "end" });
    }

    count.current = replies;
  }, [thread]);

  const send = async (draft: Draft) => {
    try {
      await trpc.chat.send.mutate({
        channelId: thread!.parent.channelId,
        parentId: messageId,
        body: draft.body,
        fileIds: draft.fileIds,
        clientId: crypto.randomUUID(),
      });
      await load();
      onChanged();
    } catch (error) {
      toastError(error, "Could not send your reply");
    }
  };

  const toggleFollow = async () => {
    try {
      await trpc.chat.followThread.mutate({
        parentId: messageId,
        following: !following,
      });
      setFollowing(!following);
      toastSuccess(
        !following
          ? "Following this thread"
          : "Unfollowed. It will leave your Threads list.",
      );
    } catch (error) {
      toastError(error, "Could not change that");
    }
  };

  const schedule = async (draft: Draft, at: Date) => {
    if (!thread) return;

    try {
      await trpc.chat.schedule.mutate({
        channelId: thread.parent.channelId,
        parentId: messageId,
        body: draft.body,
        sendAt: at,
      });
      toastSuccess(`Reply scheduled for ${untilLabel(at)}`);
    } catch (error) {
      toastError(error, "Could not schedule the reply");
    }
  };

  return (
    <aside
      aria-label="Thread"
      className="flex h-full w-full flex-col border-l border-hairline bg-canvas"
    >
      <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <div className="flex-1">
          <h2 className="font-semibold">Thread</h2>
          <p className="font-mono text-[11px] text-ink-3">#{channelName}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Summarize this thread"
          title="Summarize"
          disabled={!thread}
          onClick={() => setSummary(true)}
        >
          <SparklesIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={following ? "Unfollow this thread" : "Follow this thread"}
          aria-pressed={following}
          title={following ? "Following" : "Not following"}
          onClick={() => void toggleFollow()}
        >
          {following ? (
            <BellIcon className="size-4" />
          ) : (
            <BellOffIcon className="size-4 text-ink-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close thread"
          onClick={onClose}
        >
          <XIcon className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {!thread && !failed ? (
          <div className="flex flex-col gap-4 px-4 py-3" aria-busy="true">
            <Skeleton className="h-12" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : null}
        {failed && !thread ? (
          <p className="px-4 py-6 text-sm text-ink-2">
            Couldn’t load this thread.{" "}
            <button
              type="button"
              onClick={() => void load()}
              className="text-signal-strong underline underline-offset-2"
            >
              Try again
            </button>
          </p>
        ) : null}
        {thread ? (
          <>
            <MessageItem
              message={thread.parent}
              meId={meId}
              canPost={canPost}
              inThread
              actions={{ ...actions, onPin: undefined }}
            />
            <div className="flex items-center gap-3 px-4 py-2 font-mono text-[11px] text-ink-3">
              <span>
                {thread.replies.length}{" "}
                {thread.replies.length === 1 ? "reply" : "replies"}
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
            </div>
            {thread.replies.map((reply, index) => (
              <MessageItem
                key={reply.id}
                message={reply}
                meId={meId}
                canPost={canPost}
                inThread
                grouped={
                  index > 0 &&
                  thread.replies[index - 1]!.author?.memberId ===
                    reply.author?.memberId
                }
                actions={{
                  ...actions,
                  onPin: undefined,
                  onCreateTask: undefined,
                }}
              />
            ))}
            <div ref={end} />
          </>
        ) : null}
      </div>

      <div className="border-t border-hairline p-3">
        <Composer
          compact
          placeholder="Reply…"
          people={people}
          canAttach={canAttach}
          disabled={!canPost}
          disabledNote="You can read this thread but not reply."
          offline={offline}
          onSend={send}
          draftScope={
            thread
              ? {
                  channelId: thread.parent.channelId,
                  key: `${thread.parent.channelId}:${messageId}`,
                }
              : undefined
          }
          onSchedule={schedule}
        />
      </div>

      {summary && thread ? (
        <SummaryDialog
          channelId={thread.parent.channelId}
          parentId={messageId}
          title={`Thread in #${channelName}`}
          onClose={() => setSummary(false)}
        />
      ) : null}
    </aside>
  );
}
