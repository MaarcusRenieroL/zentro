import { useMemo, useState, type ReactNode } from "react";

import { CalendarIcon, CheckIcon, SearchIcon, Trash2Icon } from "lucide-react";

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
  savingField: string | null;
  onSave: (field: string, values: TaskUpdate) => void;
  onDelete: () => void;
  canEdit: boolean;
  canAssign: boolean;
  canDelete: boolean;
  /** The Thread tile, shown under Details. */
  thread?: ReactNode;
};

export function TaskDetailSidebar({
  task,
  members,
  savingField,
  onSave,
  onDelete,
  canEdit,
  canAssign,
  canDelete,
  thread,
}: Props) {
  return (
    <aside className="flex flex-col gap-4">
      <Select
        value={toTaskStatus(task.status)}
        onValueChange={(status: TaskStatus) => onSave("status", { status })}
        disabled={savingField === "status" || !canEdit}
      >
        <SelectTrigger
          aria-label="Status"
          className="h-11 w-full justify-start gap-2.5 rounded-md border-hairline bg-surface px-3 text-[15px] font-medium shadow-none data-[size=default]:h-11 [&>svg:last-child]:ml-auto"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(
            [
              ["backlog", "Backlog"],
              ["todo", "To do"],
              ["in-progress", "In progress"],
              ["review", "Review"],
              ["done", "Done"],
            ] as const
          ).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              <StatusGlyph status={value} size={12} decorative />
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <section aria-label="Details" className="tile px-4 py-2">
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
              className="h-8 border-0 bg-transparent px-1.5 -ml-1.5 shadow-none hover:bg-hover"
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
          <DuePicker
            value={task.due}
            done={task.status === "done"}
            disabled={savingField === "dueAt" || !canEdit}
            onChange={(dueAt) => onSave("dueAt", { dueAt })}
          />
        </DetailRow>

        <DetailRow label="Team">
          <span className="flex items-center gap-2.5">
            {task.teamName ? (
              <span
                aria-hidden="true"
                className="size-2.5 rounded-[3px] border border-hairline bg-tint-teams"
              />
            ) : null}
            <span className={task.teamName ? undefined : "text-ink-3"}>
              {task.teamName ?? "No team"}
            </span>
          </span>
        </DetailRow>

        {task.reporter ? (
          <DetailRow label="Reporter">
            <span className="inline-flex items-center gap-2.5">
              <AvatarInitials value={task.reporter} />
              {task.reporter}
            </span>
          </DetailRow>
        ) : null}
      </section>

      {thread}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="font-mono text-[11px] text-ink-3">
          Created {formatDate(task.createdAt)} · updated{" "}
          {formatDate(task.updatedAt)}
        </p>
        {canDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-text hover:bg-danger-subtle hover:text-danger-text"
                disabled={savingField === "delete"}
              >
                <Trash2Icon className="size-3.5" />
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
          className="-ml-1.5 h-8 w-[calc(100%+0.375rem)] justify-start gap-2.5 px-1.5 text-sm font-normal text-ink hover:bg-hover disabled:opacity-100"
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
              <span
                aria-hidden="true"
                className="size-6 rounded-full border-[1.5px] border-dashed border-line-strong"
              />
              <span className="text-ink-3">Unassigned</span>
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
            <span
              aria-hidden="true"
              className="size-6 rounded-full border-[1.5px] border-dashed border-line-strong"
            />
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

type DuePickerProps = {
  value: Date | null;
  done: boolean;
  disabled: boolean;
  onChange: (value: Date | null) => void;
};

/** The due date as it reads ("Tomorrow"), the date beside it, a picker on click. */
function DuePicker({ value, done, disabled, onChange }: DuePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(getDateInputValue(value));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(getDateInputValue(value));
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          aria-label="Due date"
          className="-ml-1.5 h-8 justify-start gap-2.5 px-1.5 text-sm font-normal hover:bg-hover disabled:opacity-100"
        >
          {value ? (
            <>
              <DueDate value={value} done={done} className="text-sm" />
              <span className="font-mono text-xs text-ink-3">
                {value.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2 font-mono text-[13px] text-ink-3">
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              No date
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-2xl p-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onChange(draft ? new Date(draft) : null);
            setOpen(false);
          }}
        >
          <Input
            type="date"
            aria-label="Due date"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="font-mono"
          />
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Remove date
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
