import { useMemo, useState, type ReactNode } from "react";

import {
  CheckIcon,
  SearchIcon,
  Trash2Icon,
  UserCircleIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zentro/ui/components/shadcn/alert-dialog";
import { PriorityMeter, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import type { TaskPriority, TaskStatus } from "~/src/features/tasks/lib/types";

import { DueDate } from "~/src/components/due-date";

import { AvatarInitials } from "./avatar-initials";
import { DetailRow } from "./detail-row";
import {
  formatDate,
  getDateInputValue,
  toTaskPriority,
  toTaskStatus,
} from "./task-detail-utils";
import type { MemberOption, TaskDetail, TaskUpdate } from "./types";

type Props = {
  task: TaskDetail;
  members: MemberOption[];
  selectedAssignee: MemberOption | null | undefined;
  savingField: string | null;
  onSave: (field: string, values: TaskUpdate) => void;
  onDelete: () => void;
  canEdit: boolean;
  canAssign: boolean;
  canDelete: boolean;
  /** The Thread tile, shown between Details and the danger zone. */
  thread?: ReactNode;
};

export function TaskDetailSidebar({
  task,
  members,
  selectedAssignee,
  savingField,
  onSave,
  onDelete,
  canEdit,
  canAssign,
  canDelete,
  thread,
}: Props) {
  return (
    <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
      <Select
        value={toTaskStatus(task.status)}
        onValueChange={(status: TaskStatus) => onSave("status", { status })}
        disabled={savingField === "status" || !canEdit}
      >
        <SelectTrigger
          aria-label="Status"
          className="h-11 w-full rounded-xl border-hairline bg-surface px-3.5 text-sm"
        >
          <StatusGlyph
            status={toTaskStatus(task.status)}
            size={14}
            decorative
          />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="backlog">Backlog</SelectItem>
          <SelectItem value="todo">To do</SelectItem>
          <SelectItem value="in-progress">In progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>

      <section aria-label="Details" className="tile overflow-hidden">
        <DetailRow label="Assignee">
          <AssigneePicker
            members={members}
            value={task.assignedToMemberId}
            disabled={savingField === "assignee" || !canAssign}
            onChange={(assignedToMemberId) =>
              onSave("assignee", { assignedToMemberId })
            }
          />
        </DetailRow>

        <DetailRow label="Priority">
          <Select
            value={toTaskPriority(task.priority)}
            onValueChange={(priority: TaskPriority) =>
              onSave("priority", { priority })
            }
            disabled={savingField === "priority" || !canEdit}
          >
            <SelectTrigger
              aria-label="Priority"
              className="h-8 border-0 bg-transparent px-0 shadow-none hover:bg-hover"
            >
              <PriorityMeter priority={task.priority} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </DetailRow>

        <DetailRow label="Due date">
          <div className="flex items-center gap-2">
            {task.due ? (
              <DueDate value={task.due} done={task.status === "done"} />
            ) : null}
            <Input
              type="date"
              value={getDateInputValue(task.due)}
              onChange={(event) =>
                onSave("dueAt", {
                  dueAt: event.target.value
                    ? new Date(event.target.value)
                    : null,
                })
              }
              disabled={savingField === "dueAt" || !canEdit}
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 font-mono text-xs text-ink-2 shadow-none hover:bg-hover"
            />
            {task.due && canEdit ? (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={savingField === "dueAt"}
                aria-label="Remove due date"
                onClick={() => onSave("dueAt", { dueAt: null })}
              >
                <XIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        </DetailRow>

        <DetailRow label="Team">
          <span
            className={task.teamName ? "font-medium" : "text-muted-foreground"}
          >
            {task.teamName ?? "No team"}
          </span>
        </DetailRow>

        {task.reporter ? (
          <DetailRow label="Reporter">
            <span className="inline-flex items-center gap-2 font-medium">
              <AvatarInitials value={task.reporter} />
              {task.reporter}
            </span>
          </DetailRow>
        ) : null}
      </section>

      {thread}

      {canDelete ? (
        <Card className="rounded-md border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  disabled={savingField === "delete"}
                >
                  <Trash2Icon className="size-4" />
                  Delete task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {task.key}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This task will be removed from task lists and boards. Its
                    activity history is kept for audit trails.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    Delete task
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-1 px-2 text-xs text-muted-foreground">
        <p>Created {formatDate(task.createdAt)}</p>
        <p>Updated {formatDate(task.updatedAt)}</p>
        {selectedAssignee ? (
          <p>Assigned to {selectedAssignee.name ?? selectedAssignee.email}</p>
        ) : null}
      </div>
    </aside>
  );
}

type AssigneePickerProps = {
  members: MemberOption[];
  value: string | null;
  disabled: boolean;
  onChange: (value: string | null) => void;
};

function AssigneePicker({
  members,
  value,
  disabled,
  onChange,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedMember = value
    ? members.find((member) => member.id === value)
    : null;

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) =>
      [member.name, member.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [members, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className="h-9 w-full justify-start px-0 font-normal hover:bg-muted"
        >
          {selectedMember ? (
            <>
              <AvatarInitials
                value={selectedMember.name ?? selectedMember.email}
              />
              <span className="truncate">
                {selectedMember.name ?? selectedMember.email}
              </span>
            </>
          ) : (
            <>
              <UserCircleIcon className="size-5 text-muted-foreground" />
              <span className="text-muted-foreground">Unassigned</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-72 p-2"
      >
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            className="h-9 pl-8"
          />
        </div>

        <div className="mt-2 max-h-72 overflow-y-auto">
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
          >
            <UserCircleIcon className="size-5 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">Unassigned</span>
            {!value ? <CheckIcon className="size-4 text-primary" /> : null}
          </button>

          {filteredMembers.map((member) => {
            const label = member.name ?? member.email;
            const isSelected = member.id === value;

            return (
              <button
                type="button"
                key={member.id}
                className={cn(
                  "flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted",
                  isSelected && "bg-muted",
                )}
                onClick={() => {
                  onChange(member.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <AvatarInitials value={label} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {isSelected ? (
                  <CheckIcon className="size-4 text-primary" />
                ) : null}
              </button>
            );
          })}

          {!filteredMembers.length ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No members found.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
