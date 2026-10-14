import { paths } from "~/src/lib/paths";
import { useState } from "react";

import Link from "next/link";
import { ArrowLeftIcon, CheckSquareIcon, LinkIcon } from "lucide-react";

import { toastError, toastSuccess } from "@zentro/ui/index";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";

import { useAnyPermission } from "~/src/components/permissions/permission-provider";

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
  const resource = {
    projectId: task.projectId,
    teamId: task.teamId ?? undefined,
    // `_own` edit and delete rights apply to tasks the user created.
    ownerUserId: task.createdByUserId,
  };
  const canEdit = useAnyPermission(
    ["tasks.update_any", "tasks.update_own"],
    resource,
  );
  const canAssign = useAnyPermission(["tasks.assign"], resource);
  const canDelete = useAnyPermission(
    ["tasks.delete_any", "tasks.delete_own"],
    resource,
  );
  const canComment = useAnyPermission(["tasks.comment"], resource);

  return (
    <section className="flex w-full flex-col gap-6">
      <TaskDetailHeader task={task} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <main className="min-w-0 space-y-7">
          <div className="space-y-3">
            <InlineTitleEditor
              disabled={savingField === "name" || !canEdit}
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
                tabIndex={canEdit ? 0 : -1}
                className="block w-full rounded-md border border-transparent text-left hover:border-border hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => canEdit && setIsDescriptionEditing(true)}
                onKeyDown={(event) => {
                  if (canEdit && (event.key === "Enter" || event.key === " ")) {
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

          <TaskDetailActivity
            members={members}
            comments={comments}
            activityEvents={activityEvents}
            commentDisabled={savingField === "comment"}
            canComment={canComment}
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
          canEdit={canEdit}
          canAssign={canAssign}
          canDelete={canDelete}
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
          <Link href={paths.tasks()} aria-label="Back to tasks">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <Link href={paths.tasks()} className="hover:text-foreground">
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
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Copy task link"
          onClick={() => {
            void navigator.clipboard
              .writeText(window.location.href)
              .then(() => toastSuccess("Link copied"))
              .catch(() => toastError("Error", "Could not copy the link"));
          }}
        >
          <LinkIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
