import { paths } from "~/src/lib/paths";

import Link from "next/link";
import { GitBranchIcon, LinkIcon } from "lucide-react";
import { formatGitCheckoutCommand } from "~/src/features/tasks/lib/format";

import { toastError, toastSuccess } from "@zentro/ui/index";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Button } from "@zentro/ui/shadcn/button";
import {
  RichTextEditor,
  RichTextPreview,
} from "@zentro/ui/components/rich-text-editor";

import { StarButton } from "~/src/components/favorites/star-button";
import { LinkedWork } from "~/src/components/links/linked-work";
import { LinkedThread } from "~/src/components/thread/linked-thread";
import { useAnyPermission } from "~/src/components/permissions/permission-provider";

import { InlineTitleEditor } from "./inline-title-editor";
import { TaskDetailActivity } from "./task-detail-activity";
import { TaskDetailSidebar } from "./task-detail-sidebar";
import { TaskSubtasks } from "./task-subtasks";
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
  savingField,
  onSave,
  onDelete,
  comments,
  activityEvents,
  onAddComment,
}: Props) {
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
    <section className="flex w-full max-w-[1240px] flex-wrap items-start gap-8">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-7">
        <div className="flex flex-col gap-3">
          <TaskDetailHeader task={task} />
          <InlineTitleEditor
            disabled={savingField === "name" || !canEdit}
            value={task.name}
            onSave={(name) => onSave("name", { name })}
          />
        </div>

        <section aria-label="Description">
          {canEdit ? (
            <RichTextEditor
              disabled={savingField === "description"}
              value={task.description ?? ""}
              placeholder="Add details, steps or links."
              showActions="dirty"
              minHeightClassName="px-[22px] pt-[18px] pb-[22px] [&_.ProseMirror]:min-h-24"
              onSave={(description) => onSave("description", { description })}
            />
          ) : (
            <div className="tile px-[22px] pt-[18px] pb-[22px]">
              <RichTextPreview
                value={task.description ?? ""}
                emptyLabel="No description yet."
                className="min-h-0 p-0 text-[15px] leading-6"
              />
            </div>
          )}
        </section>

        <TaskSubtasks task={task} canEdit={canEdit} />

        <TaskDetailActivity
          members={members}
          comments={comments}
          activityEvents={activityEvents}
          commentDisabled={savingField === "comment"}
          canComment={canComment}
          onAddComment={onAddComment}
        />
      </div>

      <div className="flex w-full min-w-0 flex-[0_1_340px] flex-col">
        <TaskDetailSidebar
          task={task}
          members={members}
          savingField={savingField}
          onSave={onSave}
          onDelete={onDelete}
          canEdit={canEdit}
          canAssign={canAssign}
          canDelete={canDelete}
          thread={
            <>
              <LinkedWork
                source={{ type: "task", key: task.key }}
                selfId={task.id}
                canEdit={canEdit}
                refreshKey={task.description ?? ""}
                newDoc={{
                  projectId: task.projectId ?? null,
                  title: `${task.key}: ${task.name}`,
                }}
              />
              <section aria-label="Thread" className="tile p-4">
                <LinkedThread
                  header={(count) => (
                    <div className="flex items-baseline justify-between pb-3">
                      <h2 className="eyebrow">Thread</h2>
                      <span className="font-mono text-xs text-ink-3">
                        {count} linked
                      </span>
                    </div>
                  )}
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
                />
              </section>
            </>
          }
        />
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
        <StatusGlyph status={task.status} size={12} decorative />
        {task.key}
      </span>
      {task.parentTask ? (
        <span className="flex items-center gap-1 font-mono text-xs text-ink-3">
          <span>(subtask of</span>
          <Link
            href={paths.task(task.parentTask.key)}
            className="text-ink-2 hover:text-ink hover:underline"
          >
            {task.parentTask.key}
          </Link>
          <span>)</span>
        </span>
      ) : null}
      <Button
        variant="outline"
        size="xs"
        className="ml-1 h-[26px] rounded-sm border-hairline bg-transparent px-2 text-xs font-normal text-ink-2"
        onClick={() => {
          void navigator.clipboard
            .writeText(formatGitCheckoutCommand(task.key, task.name))
            .then(() => toastSuccess("Branch command copied"))
            .catch(() => toastError("Error", "Could not copy branch command"));
        }}
      >
        <GitBranchIcon className="size-3.5" />
        Copy branch
      </Button>
      <Button
        variant="outline"
        size="xs"
        className="h-[26px] rounded-sm border-hairline bg-transparent px-2 text-xs font-normal text-ink-2"
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
      <StarButton
        type="task"
        id={task.id}
        title={task.name}
        href={`/tasks/${task.key}`}
        className="size-[26px]"
      />
    </div>
  );
}
