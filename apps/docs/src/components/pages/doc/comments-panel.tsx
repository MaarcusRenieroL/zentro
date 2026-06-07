"use client";

import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { CheckIcon, MessageSquareIcon, SendIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import { formatDocDate, getInitials } from "../../../lib/docs";

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
};

export function CommentsPanel({ docId }: CommentsPanelProps) {
  const trpc = useTrpcClient();
  const [comments, setComments] = useState<DocComment[]>([]);
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

  return (
    <aside className="hidden w-84 shrink-0 border-l bg-muted/20 xl:block">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4" />
          <p className="text-sm font-semibold">Comments</p>
        </div>
        <Badge variant="secondary">{comments.length} open</Badge>
      </div>

      <div className="space-y-3 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg bg-background"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !comments.length ? (
          <div className="rounded-lg border bg-background p-5 text-center">
            <MessageSquareIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No open comments</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Leave a note when something needs review.
            </p>
          </div>
        ) : null}

        {comments.map((comment) => {
          const author =
            comment.authorName ?? comment.authorEmail ?? "Unknown author";

          return (
            <div
              key={comment.id}
              className="rounded-lg border bg-background p-3"
            >
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback>{getInitials(author)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{author}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDocDate(comment.createdAt)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {comment.body}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={savingId === comment.id}
                  onClick={() => resolveComment(comment.id)}
                >
                  <CheckIcon className="size-4" />
                  {savingId === comment.id ? "Resolving..." : "Resolve"}
                </Button>
              </div>
            </div>
          );
        })}

        <div className="rounded-lg border bg-background p-3">
          <Textarea
            placeholder="Add a comment..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button
            className="mt-2 w-full"
            size="sm"
            disabled={!body.trim() || savingId === "new"}
            onClick={createComment}
          >
            <SendIcon className="size-4" />
            {savingId === "new" ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
