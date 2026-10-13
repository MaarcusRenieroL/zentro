import { useState, type ReactNode } from "react";

import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckSquareIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";

import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";

import { InlineTitleEditor } from "./inline-title-editor";
import { TaskDetailActivity } from "./task-detail-activity";
import { TaskDetailSidebar } from "./task-detail-sidebar";
import type {
  MemberOption,
  TaskActivityEvent,
  TaskComment,
  TaskDetail,
  TaskUpdate,
} from "./types";

type Props = {
  task: TaskDetail;
  members: MemberOption[];
  selectedAssignee: MemberOption | null | undefined;
  savingField: string | null;
  onSave: (field: string, values: TaskUpdate) => void;
  onDelete: () => void;
  comments: TaskComment[];
  activityEvents: TaskActivityEvent[];
  onAddComment: (body: string) => void;
};

export function TaskDetailView({
  task,
  members,
  selectedAssignee,
  savingField,
  onSave,
  onDelete,
  comments,
  activityEvents,
  onAddComment,
}: Props) {
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);

  return (
    <section className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
      <TaskDetailHeader task={task} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <main className="min-w-0 space-y-7">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Add child item"
              >
                <PlusIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="More actions"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </div>

            <InlineTitleEditor
              disabled={savingField === "name"}
              value={task.name}
              onSave={(name) => onSave("name", { name })}
            />
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Description</h2>
            {isDescriptionEditing ? (
              <RichTextEditor
                disabled={savingField === "description"}
                value={task.description ?? ""}
                placeholder="Describe the problem, acceptance criteria, implementation notes, and links."
                minHeightClassName="[&_.ProseMirror]:min-h-44"
                onCancel={() => setIsDescriptionEditing(false)}
                onSave={(description) => {
                  onSave("description", { description });
                  setIsDescriptionEditing(false);
                }}
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                className="block w-full rounded-md border border-transparent text-left hover:border-border hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => setIsDescriptionEditing(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsDescriptionEditing(true);
                  }
                }}
              >
                <RichTextPreview
                  value={task.description ?? ""}
                  emptyLabel="Edit description"
                />
              </div>
            )}
          </section>

          <TaskLinksSection
            title="Subtasks"
            icon={<PlusIcon className="mr-2 size-4" />}
            action="Add subtask"
          />
          <TaskLinksSection
            title="Linked work items"
            icon={<LinkIcon className="mr-2 size-4" />}
            action="Add linked work item"
          />

          <TaskDetailActivity
            members={members}
            comments={comments}
            activityEvents={activityEvents}
            commentDisabled={savingField === "comment"}
            onAddComment={onAddComment}
          />
        </main>

        <TaskDetailSidebar
          task={task}
          members={members}
          selectedAssignee={selectedAssignee}
          savingField={savingField}
          onSave={onSave}
          onDelete={onDelete}
        />
      </div>
    </section>
  );
}

function TaskDetailHeader({ task }: { task: TaskDetail }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-3">
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/tasks" aria-label="Back to tasks">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <Link href="/tasks" className="hover:text-foreground">
          Tasks
        </Link>
        <span>/</span>
        <span className="truncate">{task.projectName}</span>
        <span>/</span>
        <Badge variant="outline" className="rounded-md">
          <CheckSquareIcon className="size-3" />
          {task.key}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" aria-label="Copy task link">
          <LinkIcon className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="More actions">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

type TaskLinksSectionProps = {
  title: string;
  icon: ReactNode;
  action: string;
};

function TaskLinksSection({ title, icon, action }: TaskLinksSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <button className="flex h-9 w-full items-center rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        {icon}
        {action}
      </button>
    </section>
  );
}
