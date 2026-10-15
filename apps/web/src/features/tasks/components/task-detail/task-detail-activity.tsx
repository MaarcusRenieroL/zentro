"use client";

import { useState, type KeyboardEvent } from "react";

import { CircleDotIcon, HistoryIcon, MessageSquareIcon } from "lucide-react";

import { Kbd } from "@zentro/ui/components/kbd";
import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";
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

const tabTrigger =
  "h-full flex-none rounded-none px-0 text-sm font-normal data-[state=active]:font-medium";

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
    <section aria-label="Activity" className="flex flex-col">
      <Tabs defaultValue="comments" className="flex-col gap-3.5">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-5 group-data-horizontal/tabs:h-9"
        >
          <TabsTrigger value="comments" className={tabTrigger}>
            Comments
            <span className="font-mono text-xs text-ink-3">
              {comments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="history" className={tabTrigger}>
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="comments"
          className="m-0 flex min-w-0 flex-col gap-3.5"
        >
          <CommentList comments={comments} />
          {canComment ? (
            <CommentComposer
              disabled={commentDisabled}
              onAddComment={onAddComment}
            />
          ) : (
            <p className="text-sm text-ink-3">
              You do not have permission to comment on this task.
            </p>
          )}
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

/** A card at the end of the thread: the editor opens once you start. */
function CommentComposer({ disabled, onAddComment }: CommentComposerProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const empty = !draft || draft === "<p></p>";

  const send = () => {
    if (empty || disabled) return;
    onAddComment(draft);
    setDraft("");
    setEditorKey((key) => key + 1);
    setIsComposing(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      send();
    }
  };

  return (
    <div
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface p-3"
    >
      {isComposing ? (
        <RichTextEditor
          key={editorKey}
          value=""
          disabled={disabled}
          showActions={false}
          placeholder="Write a comment."
          minHeightClassName="[&_.ProseMirror]:min-h-16"
          onChange={setDraft}
          onSave={setDraft}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsComposing(true)}
          className="min-h-11 rounded-md px-0.5 text-left text-[15px] text-ink-3 outline-none hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Write a comment.
        </button>
      )}
      <div className="flex items-center gap-2">
        <span className="flex-1" />
        {isComposing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft("");
              setEditorKey((key) => key + 1);
              setIsComposing(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          variant="outline"
          onClick={() => (isComposing ? send() : setIsComposing(true))}
          disabled={disabled}
          className="h-8 border-hairline bg-transparent px-3 text-[13px]"
        >
          Comment
          <Kbd className="ml-1">⌘↵</Kbd>
        </Button>
      </div>
    </div>
  );
}

function CommentList({ comments }: { comments: TaskComment[] }) {
  if (!comments.length) {
    return (
      <p className="text-sm text-ink-3">
        No comments yet. Start the conversation with context, decisions or
        blockers.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {comments.map((comment) => {
        const author = comment.authorName ?? comment.authorEmail ?? "Unknown";

        return (
          <article key={comment.id} className="flex gap-3">
            <AvatarInitials value={author} size={32} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold">{author}</span>
                <span className="font-mono text-xs text-ink-3">
                  {formatActivityDate(comment.createdAt)}
                </span>
              </div>
              <RichTextPreview
                value={comment.body}
                className="min-h-0 rounded-none p-0 text-[15px] leading-[22px] text-ink"
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

  const date = new Date(value);
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day =
    date.toDateString() === new Date().toDateString()
      ? "Today"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${day} · ${time}`;
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
