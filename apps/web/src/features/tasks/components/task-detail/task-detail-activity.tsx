"use client";

import { authClient } from "@zentro/auth/client";
import { useEffect, useState } from "react";

import {
  CircleDotIcon,
  HistoryIcon,
  MessageSquareIcon,
  SendIcon,
} from "lucide-react";

import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zentro/ui/shadcn/tabs";

import { AvatarInitials } from "./avatar-initials";
import { formatDate } from "./task-detail-utils";
import type { MemberOption, TaskActivityEvent, TaskComment } from "./types";

type Props = {
  members: MemberOption[];
  comments: TaskComment[];
  activityEvents: TaskActivityEvent[];
  commentDisabled: boolean;
  onAddComment: (body: string) => void;
  canComment?: boolean;
};

export function TaskDetailActivity({
  members,
  comments,
  activityEvents,
  commentDisabled,
  onAddComment,
  canComment = true,
}: Props) {
  const historyEvents = activityEvents.filter(
    (event) => event.type !== "comment.created",
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Activity</h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="rounded-md">
            {comments.length} comments
          </Badge>
          <Badge variant="outline" className="rounded-md">
            {historyEvents.length} updates
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="comments" className="flex-col gap-3">
        <TabsList className="h-8 w-full justify-start overflow-x-auto rounded-md bg-muted/60 p-1 sm:w-fit">
          <TabsTrigger value="all" className="gap-2">
            <CircleDotIcon className="size-3.5" />
            All
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquareIcon className="size-3.5" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <HistoryIcon className="size-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="m-0 min-w-0 space-y-4">
          {canComment ? (
            <CommentComposer
              disabled={commentDisabled}
              onAddComment={onAddComment}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have permission to comment on this task.
            </p>
          )}
          <CommentList comments={comments} />
        </TabsContent>

        <TabsContent value="all" className="m-0 min-w-0">
          <ActivityList
            events={activityEvents}
            members={members}
            includeComments
          />
        </TabsContent>

        <TabsContent value="history" className="m-0 min-w-0">
          <ActivityList members={members} events={historyEvents} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

type CommentComposerProps = {
  disabled: boolean;
  onAddComment: (body: string) => void;
};

function CommentComposer({ disabled, onAddComment }: CommentComposerProps) {
  const [currentUserName, setCurrentUserName] = useState("");

  useEffect(() => {
    void authClient.getSession().then(({ data }) => {
      setCurrentUserName(data?.user.name ?? data?.user.email ?? "");
    });
  }, []);
  const [isComposing, setIsComposing] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  if (!isComposing) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-hairline/60 bg-card shadow-sm p-3 shadow-xs">
        <div className="pt-0.5">
          <AvatarInitials value={currentUserName} />
        </div>
        <button
          className="flex min-h-10 min-w-0 flex-1 items-center rounded-xl border border-hairline/60 bg-surface px-3 text-left text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-muted/40 hover:text-foreground"
          onClick={() => setIsComposing(true)}
        >
          Add a comment...
        </button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Add comment"
          onClick={() => setIsComposing(true)}
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-hairline/60 bg-card shadow-sm p-3 shadow-xs">
      <div className="pt-1">
        <AvatarInitials value={currentUserName} />
      </div>
      <div className="min-w-0 flex-1">
        <RichTextEditor
          key={editorKey}
          value=""
          disabled={disabled}
          placeholder="Add a comment..."
          minHeightClassName="[&_.ProseMirror]:min-h-24"
          onCancel={() => setIsComposing(false)}
          onSave={(body) => {
            onAddComment(body);
            setEditorKey((key) => key + 1);
            setIsComposing(false);
          }}
        />
      </div>
    </div>
  );
}

function CommentList({ comments }: { comments: TaskComment[] }) {
  if (!comments.length) {
    return (
      <ActivityEmptyState
        icon={<MessageSquareIcon className="size-4" />}
        title="No comments yet"
        message="Start the conversation with context, decisions, or blockers."
      />
    );
  }

  return (
    <div className="space-y-1">
      {comments.map((comment) => {
        const author = comment.authorName ?? comment.authorEmail ?? "Unknown";

        return (
          <article
            key={comment.id}
            className="group flex gap-3 rounded-md px-1 py-3 transition hover:bg-muted/30"
          >
            <div className="pt-1">
              <AvatarInitials value={author} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="font-semibold">{author}</span>
                <span className="text-xs text-muted-foreground">
                  {formatActivityDate(comment.createdAt)}
                </span>
              </div>
              <RichTextPreview
                value={comment.body}
                className="mt-1 min-h-0 rounded-none p-0 text-foreground"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

type ActivityListProps = {
  events: TaskActivityEvent[];
  members: MemberOption[];
  includeComments?: boolean;
};

function ActivityList({
  events,
  members,
  includeComments = false,
}: ActivityListProps) {
  const visibleEvents = includeComments
    ? events
    : events.filter((event) => event.type !== "comment.created");

  if (!visibleEvents.length) {
    return (
      <ActivityEmptyState
        icon={<HistoryIcon className="size-4" />}
        title="No activity yet"
        message="Task updates, comments, and changes will appear here."
      />
    );
  }

  return (
    <div className="relative before:absolute before:left-[11px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border">
      {visibleEvents.map((event) => {
        const actor = event.actorName ?? event.actorEmail ?? "Unknown";
        const label = getActivityLabel(event, members);

        return (
          <div
            key={event.id}
            className="relative flex gap-3 rounded-md px-1 py-2 hover:bg-muted/30"
          >
            <span className="relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full border bg-background">
              {event.type === "comment.created" ? (
                <MessageSquareIcon className="size-3 text-primary" />
              ) : (
                <CircleDotIcon className="size-3 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-semibold">{actor}</span>
                <span className="text-muted-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatActivityDate(event.createdAt)}
                </span>
              </div>
              {event.commentBody ? (
                <RichTextPreview
                  value={event.commentBody}
                  className="mt-2 min-h-0 rounded-md bg-muted/40 px-3 py-2"
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getActivityLabel(event: TaskActivityEvent, members: MemberOption[]) {
  if (event.type === "task.created") {
    return "created this task";
  }

  if (event.type === "task.deleted") {
    return "deleted this task";
  }

  if (event.type === "comment.created") {
    return "commented";
  }

  if (event.type === "task.updated" && event.field) {
    if (event.field === "description") {
      return "updated description";
    }

    return `changed ${getFieldLabel(event.field)} from ${formatActivityValue(
      event.fromValue,
      event.field,
      members,
    )} to ${formatActivityValue(event.toValue, event.field, members)}`;
  }

  return "updated this task";
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    assignedToMemberId: "assignee",
    dueAt: "due date",
    name: "title",
  };

  return labels[field] ?? field;
}

function formatActivityValue(
  value: string | null,
  field: string,
  members: MemberOption[],
) {
  if (!value) {
    return "None";
  }

  if (field === "status") {
    const labels: Record<string, string> = {
      backlog: "Backlog",
      todo: "To do",
      "in-progress": "In progress",
      review: "Review",
      done: "Done",
    };

    return labels[value] ?? value;
  }

  if (field === "assignedToMemberId") {
    const member = members.find((candidate) => candidate.id === value);

    return member?.name ?? member?.email ?? value;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDate(new Date(value));
  }

  return value;
}

function formatActivityDate(value: Date | null) {
  if (!value) {
    return "just now";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(value);
}

function ActivityEmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed bg-muted/20 p-4">
      <span className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
