"use client";

import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { CheckIcon, MessageSquareIcon, SendIcon, XIcon } from "lucide-react";
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
  isOpen: boolean;
  onClose: () => void;
};

export function CommentsPanel({ docId, isOpen, onClose }: CommentsPanelProps) {
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

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l bg-muted/30 shadow-xl xl:static xl:z-auto xl:max-w-none xl:shadow-none">
      <div className="sticky top-14 flex h-[calc(100vh-7rem)] flex-col">
        <div className="flex items-center justify-between border-b bg-background px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MessageSquareIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Comments</p>
              <p className="text-xs text-muted-foreground">Open review notes</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="rounded-md">
              {comments.length}
            </Badge>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <XIcon className="size-4" />
              <span className="sr-only">Hide comments</span>
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
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
            <div className="rounded-lg border bg-background p-5 text-center shadow-sm">
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
                className="rounded-lg border bg-background p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback>{getInitials(author)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{author}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDocDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={savingId === comment.id}
                    onClick={() => resolveComment(comment.id)}
                  >
                    <XIcon className="size-3.5" />
                    <span className="sr-only">Resolve comment</span>
                  </Button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {comment.body}
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
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
        </div>

        <div className="border-t bg-background p-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <Textarea
              className="min-h-24 resize-none bg-background"
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
      </div>
    </aside>
  );
}
