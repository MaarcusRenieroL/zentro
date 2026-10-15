"use client";

import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { CheckIcon, SendIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import { ActorAvatar } from "~/src/components/actor-avatar";

import { formatDocDate } from "../../../lib/docs";

type DocComment = {
  id: string;
  body: string;
  authorName: string | null;
  authorEmail: string | null;
  authorImage: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CommentsPanelProps = {
  docId: string;
  canComment?: boolean;
  isOpen: boolean;
  onClose: () => void;
  /** Told how many comments are open, for the count in the top bar. */
  onCount?: (count: number) => void;
};

export function CommentsPanel({
  docId,
  canComment = true,
  isOpen,
  onClose,
  onCount,
}: CommentsPanelProps) {
  const trpc = useTrpcClient();
  const [comments, setComments] = useState<DocComment[]>([]);

  useEffect(() => {
    onCount?.(comments.length);
  }, [comments.length, onCount]);
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchComments() {
    const commentList = await trpc.docs.getComments.query({ docId });
    setComments(commentList.filter((comment) => !comment.resolvedAt));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      try {
        const commentList = await trpc.docs.getComments.query({ docId });

        if (isMounted) {
          setComments(commentList.filter((comment) => !comment.resolvedAt));
        }
      } catch (error) {
        toastError(error, "Failed to load comments");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [docId, trpc]);

  async function createComment() {
    if (!body.trim() || savingId) {
      return;
    }

    try {
      setSavingId("new");
      await trpc.docs.createComment.mutate({
        docId,
        body,
      });
      setBody("");
      await fetchComments();
      toastSuccess("Comment added");
    } catch (error) {
      toastError(error, "Failed to add comment");
    } finally {
      setSavingId(null);
    }
  }

  async function resolveComment(id: string) {
    try {
      setSavingId(id);
      await trpc.docs.resolveComment.mutate({ id });
      await fetchComments();
      toastSuccess("Comment resolved");
    } catch (error) {
      toastError(error, "Failed to resolve comment");
    } finally {
      setSavingId(null);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Comments"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-sm overflow-y-auto bg-surface shadow-xl xl:static xl:z-auto xl:max-w-none xl:overflow-visible xl:rounded-[20px] xl:border xl:border-hairline xl:shadow-none"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-[18px] pt-4 pb-3">
          <h2 className="text-[15px] font-semibold">Comments</h2>
          <span className="rounded-full border border-hairline px-2 py-px font-mono text-xs text-ink-2">
            {comments.length} open
          </span>
          <span className="flex-1" />
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <XIcon className="size-4" />
            <span className="sr-only">Hide comments</span>
          </Button>
        </div>

        <div className="flex flex-col px-2 pb-2">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : null}

          {!isLoading && !comments.length ? (
            <p className="px-3 py-6 text-center text-sm text-ink-2">
              No open comments. Leave a note when something needs review.
            </p>
          ) : null}

          {comments.map((comment) => {
            const author =
              comment.authorName ?? comment.authorEmail ?? "Unknown author";

            return (
              <div
                key={comment.id}
                className="flex gap-2.5 rounded-xl border-t border-hairline/60 p-3 first:border-t-0"
              >
                <ActorAvatar name={author} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className="truncate font-medium">{author}</span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {formatDocDate(comment.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-5 text-ink-2">
                    {comment.body}
                  </p>
                  <button
                    type="button"
                    disabled={savingId === comment.id}
                    onClick={() => resolveComment(comment.id)}
                    className="mt-1.5 flex items-center gap-1 rounded-xs text-xs text-signal outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <CheckIcon className="size-3.5" />
                    {savingId === comment.id ? "Resolving..." : "Resolve"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {canComment ? (
          <div className="flex flex-col gap-2 border-t border-hairline p-3">
            <Textarea
              className="min-h-20 resize-none"
              placeholder="Add a comment..."
              aria-label="Add a comment"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
            <Button
              size="sm"
              className="self-end"
              disabled={!body.trim() || savingId === "new"}
              onClick={createComment}
            >
              <SendIcon />
              {savingId === "new" ? "Posting..." : "Comment"}
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
