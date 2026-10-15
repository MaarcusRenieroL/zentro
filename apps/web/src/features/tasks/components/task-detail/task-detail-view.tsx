import { paths } from "~/src/lib/paths";
import { useState } from "react";

import Link from "next/link";
import { LinkIcon } from "lucide-react";

import { toastError, toastSuccess } from "@zentro/ui/index";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Button } from "@zentro/ui/shadcn/button";
import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";

import { Tile } from "@zentro/ui/components/tile";
import { LinkedThread } from "~/src/components/thread/linked-thread";
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
    <section className="flex w-full flex-col gap-5">
      <TaskDetailHeader task={task} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 space-y-7">
          <div className="space-y-3">
            <InlineTitleEditor
              disabled={savingField === "name" || !canEdit}
              value={task.name}
              onSave={(name) => onSave("name", { name })}
            />
          </div>

          <section aria-label="Description" className="tile overflow-hidden">
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
                className="block w-full p-4 text-left outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
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

        <div className="flex min-w-0 flex-col gap-4">
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
            thread={
              <Tile
                title="Thread"
                actions={
                  <span className="font-mono text-xs text-ink-3">
                    Linked work
                  </span>
                }
              >
                <LinkedThread
                  current={{
                    kind: "task",
                    label: task.name,
                    meta: task.key,
                    status: task.status,
                  }}
                  currentId={task.id}
                  projectId={task.projectId}
                  projectName={task.projectName}
                  projectSlug={task.projectSlug}
                  extra={
                    comments.length
                      ? [
                          {
                            id: "comments",
                            label: `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`,
                          },
                        ]
                      : []
                  }
                />
              </Tile>
            }
          />
        </div>
      </div>
    </section>
  );
}

function TaskDetailHeader({ task }: { task: TaskDetail }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
      <Link
        href={paths.tasksForProject(task.projectSlug)}
        className="rounded-xs hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {task.projectName}
      </Link>
      <span aria-hidden="true" className="text-ink-3">
        /
      </span>
      <Link
        href={paths.tasks()}
        className="rounded-xs hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Tasks
      </Link>
      <span aria-hidden="true" className="text-ink-3">
        /
      </span>
      <span className="flex items-center gap-1.5 font-mono text-ink">
        <StatusGlyph status={task.status} size={14} decorative />
        {task.key}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="ml-1.5"
        onClick={() => {
          void navigator.clipboard
            .writeText(window.location.href)
            .then(() => toastSuccess("Link copied"))
            .catch(() => toastError("Error", "Could not copy the link"));
        }}
      >
        <LinkIcon />
        Copy link
      </Button>
    </div>
  );
}
