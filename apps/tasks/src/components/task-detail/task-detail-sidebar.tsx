import { useMemo, useState } from "react";

import {
  BotIcon,
  CheckIcon,
  ChevronDownIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  SearchIcon,
  Trash2Icon,
  UserCircleIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
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

import type { TaskPriority, TaskStatus } from "~/src/lib/types";

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
};

export function TaskDetailSidebar({
  task,
  members,
  selectedAssignee,
  savingField,
  onSave,
  onDelete,
}: Props) {
  return (
    <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center gap-2">
        <Select
          value={toTaskStatus(task.status)}
          onValueChange={(status: TaskStatus) => onSave("status", { status })}
          disabled={savingField === "status"}
        >
          <SelectTrigger className="h-9 w-36">
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

        <Button variant="outline" size="icon-lg" aria-label="Quick action">
          <ZapIcon className="size-4" />
        </Button>
        <Button variant="outline">
          <BotIcon className="size-4" />
          Improve Task
        </Button>
      </div>

      <Card className="rounded-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ChevronDownIcon className="size-4" />
            Details
          </CardTitle>
          <Button variant="ghost" size="icon-sm" aria-label="Details settings">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <DetailRow label="Assignee">
            <AssigneePicker
              members={members}
              value={task.assignedToMemberId}
              disabled={savingField === "assignee"}
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
              disabled={savingField === "priority"}
            >
              <SelectTrigger className="h-8 border-0 bg-transparent px-0 shadow-none hover:bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </DetailRow>

          <DetailRow label="Parent">
            <span className="text-muted-foreground">None</span>
          </DetailRow>

          <DetailRow label="Due date">
            <div className="flex items-center gap-1">
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
                disabled={savingField === "dueAt"}
                className="h-8 border-0 bg-transparent px-0 shadow-none hover:bg-muted"
              />
              {task.due ? (
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

          <DetailRow label="Labels">
            <span className="text-muted-foreground">None</span>
          </DetailRow>

          <DetailRow label="Team">
            <span className="text-muted-foreground">None</span>
          </DetailRow>

          <DetailRow label="Sprint">
            <button className="font-medium text-primary hover:underline">
              Sprint 0
            </button>
          </DetailRow>

          <DetailRow label="Reporter">
            <span className="inline-flex items-center gap-2 font-medium">
              <AvatarInitials value="Maarcus" />
              Maarcus
            </span>
          </DetailRow>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ChevronDownIcon className="size-4" />
            Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <button className="flex items-center gap-2 font-medium text-primary hover:underline">
            <GitBranchIcon className="size-4" />
            Create branch
          </button>
          <button className="flex items-center gap-2 font-medium text-primary hover:underline">
            <GitBranchIcon className="size-4" />
            Create commit
          </button>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ChevronDownIcon className="size-4" />
            Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Refresh to see recent rule runs.</p>
          <button className="font-medium text-primary hover:underline">
            Create new automation rule
          </button>
        </CardContent>
      </Card>

      <Card className="rounded-md border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full justify-start"
            disabled={savingField === "delete"}
            onClick={() => {
              if (window.confirm(`Delete ${task.key}?`)) {
                onDelete();
              }
            }}
          >
            <Trash2Icon className="size-4" />
            Delete task
          </Button>
        </CardContent>
      </Card>

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
