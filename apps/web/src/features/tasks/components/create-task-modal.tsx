"use client";

import {
  useCurrentUserId,
  useReachable,
} from "~/src/components/permissions/permission-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTrpcClient } from "@zentro/api/react";
import {
  createTaskSchema,
  type CreateTaskFormValues,
} from "@zentro/api/types/zod-schema";
import { Button } from "@zentro/ui/shadcn/button";
import { RichTextEditor } from "@zentro/ui/components/rich-text-editor";
import { PriorityMeter, StatusGlyph } from "@zentro/ui/components/status-glyph";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { CalendarIcon, PlusIcon, XIcon } from "lucide-react";
import { Kbd } from "@zentro/ui/components/kbd";
import {
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { ActorAvatar } from "~/src/components/actor-avatar";

type ProjectOption = {
  id: string;
  name: string;
  taskKeyPrefix: string;
  teamName: string | null;
};

type MemberOption = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  defaultProjectId?: string;
  defaultStatus?: CreateTaskFormValues["status"];
  defaultName?: string;
  defaultDescription?: string;
  trigger?: React.ReactNode;
  onTaskCreated?: () => void | Promise<void>;
  /** Control the dialog from outside (the Create menu), with no trigger button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  /** Created from a doc: the new task is linked to it. */
  linkDocId?: string;
};

const unassignedValue = "unassigned";

const statusOptions = [
  ["backlog", "Backlog"],
  ["todo", "To do"],
  ["in-progress", "In progress"],
  ["review", "Review"],
  ["done", "Done"],
] as const;

// The form checks what the server checks, plus what only makes sense while
// creating: a new task is not due in the past.
const formSchema = createTaskSchema.superRefine((values, ctx) => {
  if (!values.dueAt) return;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (new Date(values.dueAt).getTime() < today.getTime()) {
    ctx.addIssue({
      code: "custom",
      path: ["dueAt"],
      message: "That date has passed. Pick today or later.",
    });
  }
});

const messages: Partial<Record<keyof CreateTaskFormValues, string>> = {
  name: "Give the task a name so people know what it’s about.",
};

const getDateInputValue = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

/** A 44px field box: rose when it has an error, violet ring on focus. */
const fieldBox = (invalid: boolean, extra?: string) =>
  cn(
    "h-11 w-full justify-start rounded-md border-hairline bg-surface px-3 text-[15px] shadow-none data-[size=default]:h-11 [&>svg:last-child]:ml-auto",
    extra,
    invalid &&
      "border-danger focus-visible:border-danger focus-visible:ring-danger/22",
  );

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className="flex gap-1.5 text-[13px] leading-5 text-danger-text"
    >
      <span aria-hidden="true" className="font-mono font-medium">
        !
      </span>
      {children}
    </p>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
      {children}
    </label>
  );
}

const CreateTaskModalInner: FC<Props> = ({
  defaultProjectId = "",
  defaultStatus = "todo",
  defaultName = "",
  defaultDescription = "",
  trigger,
  onTaskCreated,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  linkDocId,
}) => {
  const trpc = useTrpcClient();
  const userId = useCurrentUserId();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const blank = {
    projectId: defaultProjectId,
    name: defaultName,
    description: defaultDescription,
    status: defaultStatus,
    priority: "medium" as const,
    assignedToMemberId: null,
    dueAt: null,
  };
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getFieldState,
    formState: { isSubmitting, errors, isSubmitted },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: blank,
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      if (defaultName) setValue("name", defaultName);
      if (defaultDescription) setValue("description", defaultDescription);
      if (defaultProjectId) setValue("projectId", defaultProjectId);
    }
  }, [open, defaultName, defaultDescription, defaultProjectId, setValue]);

  const chosenProject = useWatch({ control, name: "projectId" });
  const selected = projects.find((project) => project.id === chosenProject);
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const loadOptions = async () => {
      setIsLoadingProjects(true);
      setIsLoadingMembers(true);

      try {
        const [projectList, memberList] = await Promise.all([
          trpc.project.getProjectsByOrgId.query(),
          // Needs members.view; without it tasks are created unassigned.
          trpc.member.getMembers.query().catch(() => []),
        ]);

        if (!isMounted) return;

        setProjects(
          projectList
            .filter((project) => project.status === "active")
            .map((project) => ({
              id: project.id,
              name: project.name,
              taskKeyPrefix: project.taskKeyPrefix,
              teamName: project.teamName,
            })),
        );
        setMembers(
          memberList.map((member) => ({
            id: member.id,
            userId: member.userId,
            name: member.name,
            email: member.email,
            role: member.role,
          })),
        );

        // New work is yours unless you hand it to someone.
        const mine = memberList.find((member) => member.userId === userId);

        if (mine && !getFieldState("assignedToMemberId").isDirty) {
          setValue("assignedToMemberId", mine.id);
        }
      } catch {
        toastError("Could not load projects", "Please try again.");
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
          setIsLoadingMembers(false);
        }
      }
    };

    void loadOptions();

    return () => {
      isMounted = false;
    };
  }, [getFieldState, open, setValue, trpc, userId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset(blank);
    }
  };

  const onSubmit = async (values: CreateTaskFormValues) => {
    try {
      const task = await trpc.task.createTask.mutate({
        ...values,
        description: values.description || "",
        assignedToMemberId: values.assignedToMemberId || null,
        dueAt: values.dueAt || null,
        ...(linkDocId ? { linkDocId } : {}),
      });

      toastSuccess("Task created", `${task.key} is ready.`);

      await onTaskCreated?.();
      reset(blank);
      setOpen(false);
    } catch (error) {
      toastError(
        "Could not create task",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const submit = handleSubmit(onSubmit);
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="h-10 px-3.5 font-semibold">
              <PlusIcon className="size-4" />
              Create task
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        className="gap-0 p-0 sm:max-w-[600px]"
      >
        <form noValidate onSubmit={submit} onKeyDown={onKeyDown}>
          <div className="flex items-center gap-2.5 pt-4 pr-4 pb-3 pl-6">
            <DialogTitle className="text-lg font-semibold">
              New task
            </DialogTitle>
            <span className="rounded-sm border border-dashed border-line-strong px-2 py-px font-mono text-xs text-ink-3">
              {selected ? `${selected.taskKeyPrefix}-…` : "No key yet"}
            </span>
            <span className="flex-1" />
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" className="size-8">
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
            <DialogDescription className="sr-only">
              Add work to a project and get the next project task key.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-4 px-6 pt-1 pb-5">
            <Controller
              name="projectId"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <Label>Project</Label>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      if (value !== "") field.onChange(value);
                    }}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) field.onBlur();
                    }}
                    disabled={isLoadingProjects || !projects.length}
                  >
                    <SelectTrigger
                      aria-invalid={Boolean(fieldState.error)}
                      aria-label="Project"
                      className={fieldBox(Boolean(fieldState.error))}
                    >
                      {selected ? (
                        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[7px] bg-tint-projects font-mono text-[10px] text-ink">
                          {selected.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="size-[22px] shrink-0 rounded-[7px] border-[1.5px] border-dashed border-line-strong"
                        />
                      )}
                      <SelectValue
                        placeholder={
                          isLoadingProjects
                            ? "Loading projects..."
                            : "Choose a project"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                          <span className="font-mono text-xs text-ink-3">
                            {project.taskKeyPrefix}
                            {project.teamName ? ` · ${project.teamName}` : ""}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isLoadingProjects && !projects.length ? (
                    <p className="text-[13px] text-ink-3">
                      No active projects are available.
                    </p>
                  ) : null}
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />

            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="task-name">Task name</Label>
                  <input
                    id="task-name"
                    placeholder="What needs to happen?"
                    aria-invalid={Boolean(fieldState.error)}
                    className={fieldBox(
                      Boolean(fieldState.error),
                      "border outline-none placeholder:text-ink-3 focus-visible:border-signal focus-visible:ring-[3px] focus-visible:ring-ring/22",
                    )}
                    {...field}
                  />
                  <FieldError>
                    {fieldState.error
                      ? (messages.name ?? fieldState.error.message)
                      : null}
                  </FieldError>
                </div>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <Label>Description</Label>
                  <RichTextEditor
                    value={field.value ?? ""}
                    showActions={false}
                    onChange={field.onChange}
                    onSave={field.onChange}
                    placeholder="Add details, steps or links."
                    minHeightClassName="[&_.ProseMirror]:min-h-[60px]"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-label="Status"
                        className={fieldBox(false)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <StatusGlyph status={value} size={12} decorative />
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>Priority</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-label="Priority"
                        className={fieldBox(false)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["low", "medium", "high"] as const).map((value) => (
                          <SelectItem key={value} value={value}>
                            <PriorityMeter priority={value} />
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Controller
                name="dueAt"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="task-due-date">Due date</Label>
                    <div className="relative">
                      <CalendarIcon
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2"
                      />
                      <input
                        id="task-due-date"
                        type="date"
                        aria-invalid={Boolean(fieldState.error)}
                        value={getDateInputValue(field.value)}
                        onBlur={field.onBlur}
                        onChange={(event) =>
                          field.onChange(event.target.value || null)
                        }
                        className={fieldBox(
                          Boolean(fieldState.error),
                          cn(
                            "border pl-9 font-mono outline-none focus-visible:border-signal focus-visible:ring-[3px] focus-visible:ring-ring/22",
                            !field.value && "text-ink-3",
                          ),
                        )}
                      />
                    </div>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </div>
                )}
              />
              <Controller
                name="assignedToMemberId"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>Assignee</Label>
                    <Select
                      value={field.value ?? unassignedValue}
                      onValueChange={(value) => {
                        // Radix reports "" when the options arrive together
                        // with the value; no option has an empty value.
                        if (value === "") return;
                        field.onChange(
                          value === unassignedValue ? null : value,
                        );
                      }}
                      disabled={isLoadingMembers}
                    >
                      <SelectTrigger
                        aria-label="Assignee"
                        className={fieldBox(false)}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingMembers
                              ? "Loading members..."
                              : "Select assignee"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={unassignedValue}>
                          <span
                            aria-hidden="true"
                            className="size-[22px] rounded-full border-[1.5px] border-dashed border-line-strong"
                          />
                          Unassigned
                        </SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <ActorAvatar name={member.name} size={22} />
                            {member.name}
                            {member.userId === userId ? " (you)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-hairline py-3.5 pr-4 pl-6">
            {isSubmitted && errorCount ? (
              <span role="status" className="text-[13px] text-danger-text">
                {errorCount === 1
                  ? "1 field needs a fix before this task can be created."
                  : `${errorCount} fields need a fix before this task can be created.`}
              </span>
            ) : (
              <span className="hidden text-[13px] text-ink-3 sm:block">
                Press C anywhere to open this.
              </span>
            )}
            <span className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 border-hairline bg-transparent px-3.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || isLoadingProjects || !projects.length}
              className="h-10 px-3.5 font-semibold"
            >
              Create task
              <Kbd className="ml-1 border-transparent bg-on-signal/20 text-on-signal">
                ⌘↵
              </Kbd>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateTaskModal: FC<Props> = (props) => {
  // A role on one project is enough; the server checks each project.
  const canCreate = useReachable("tasks.create");

  return canCreate ? <CreateTaskModalInner {...props} /> : null;
};
