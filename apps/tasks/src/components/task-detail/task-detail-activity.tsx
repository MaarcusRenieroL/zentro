"use client";

import { useState } from "react";

import { MessageSquareIcon } from "lucide-react";

import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";
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
};

export function TaskDetailActivity({
  members,
  comments,
  activityEvents,
  commentDisabled,
  onAddComment,
}: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Activity</h2>
      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="work-log">Work log</TabsTrigger>
        </TabsList>
        <TabsContent value="comments" className="mt-4 space-y-5">
          <CommentComposer
            disabled={commentDisabled}
            onAddComment={onAddComment}
          />
          <CommentList comments={comments} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <ActivityList
            events={activityEvents}
            members={members}
            includeComments
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ActivityList
            members={members}
            events={activityEvents.filter(
              (event) => event.type !== "comment.created",
            )}
          />
        </TabsContent>
        <TabsContent value="work-log" className="mt-4">
          <ActivityEmptyState message="No work has been logged for this task yet." />
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
  const [isComposing, setIsComposing] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  if (!isComposing) {
    return (
      <div className="flex gap-3">
        <AvatarInitials value="Maarcus" />
        <button
          className="min-h-14 min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40"
          onClick={() => setIsComposing(true)}
        >
          Add a comment...
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AvatarInitials value="Maarcus" />
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
    return <ActivityEmptyState message="No comments yet." />;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const author = comment.authorName ?? comment.authorEmail ?? "Unknown";

        return (
          <article key={comment.id} className="flex gap-3">
            <AvatarInitials value={author} />
            <div className="min-w-0 flex-1 rounded-md border bg-card p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{author}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <RichTextPreview value={comment.body} className="p-0" />
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
    return <ActivityEmptyState message="No activity has been recorded yet." />;
  }

  return (
    <div className="space-y-3">
      {visibleEvents.map((event) => {
        const actor = event.actorName ?? event.actorEmail ?? "Unknown";

        return (
          <div key={event.id} className="flex gap-3 rounded-md border p-3">
            <AvatarInitials value={actor} />
            <div className="min-w-0 flex-1 text-sm">
              <p>
                <span className="font-medium">{actor}</span>{" "}
                <span className="text-muted-foreground">
                  {getActivityLabel(event, members)}
                </span>
              </p>
              {event.commentBody ? (
                <RichTextPreview
                  value={event.commentBody}
                  className="mt-2 bg-muted/30 p-2"
                />
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </p>
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

  if (field === "assignedToMemberId") {
    const member = members.find((candidate) => candidate.id === value);

    return member?.name ?? member?.email ?? value;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDate(new Date(value));
  }

  return value;
}

function ActivityEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      <MessageSquareIcon className="mb-2 size-4" />
      {message}
    </div>
  );
}
