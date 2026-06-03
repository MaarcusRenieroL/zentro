"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTrpcClient } from "@zentro/api/react";
import {
  createTaskSchema,
  type CreateTaskFormValues,
} from "@zentro/api/types/zod-schema";
import { Button } from "@zentro/ui/shadcn/button";
import { RichTextEditor } from "@zentro/ui/components/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";
import { Field, FieldGroup, FieldLabel } from "@zentro/ui/shadcn/field";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type ProjectOption = {
  id: string;
  name: string;
  taskKeyPrefix: string;
};

type MemberOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  defaultProjectId?: string;
  defaultStatus?: CreateTaskFormValues["status"];
  trigger?: React.ReactNode;
  onTaskCreated?: () => void | Promise<void>;
};

const unassignedValue = "unassigned";

const getDateInputValue = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

export const CreateTaskModal: FC<Props> = ({
  defaultProjectId = "",
  defaultStatus = "todo",
  trigger,
  onTaskCreated,
}) => {
  const trpc = useTrpcClient();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, isValid },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      projectId: defaultProjectId,
      name: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      assignedToMemberId: null,
      dueAt: null,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const loadOptions = async () => {
      setIsLoadingProjects(true);
      setIsLoadingMembers(true);

      try {
        const [projectList, memberList] = await Promise.all([
          trpc.project.getProjectsByOrgId.query(),
          trpc.member.getMembers.query(),
        ]);

        if (!isMounted) return;

        const activeProjects = projectList.filter(
          (project) => project.status === "active",
        );

        setProjects(
          activeProjects.map((project) => ({
            id: project.id,
            name: project.name,
            taskKeyPrefix: project.taskKeyPrefix,
          })),
        );
        setMembers(
          memberList.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
          })),
        );

        if (!defaultProjectId && activeProjects[0]) {
          setValue("projectId", activeProjects[0].id, {
            shouldDirty: true,
            shouldValidate: true,
          });
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
  }, [defaultProjectId, open, setValue, trpc]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset({
        projectId: defaultProjectId,
        name: "",
        description: "",
        status: defaultStatus,
        priority: "medium",
        assignedToMemberId: null,
        dueAt: null,
      });
    }
  };

  const onSubmit = async (values: CreateTaskFormValues) => {
    try {
      const task = await trpc.task.createTask.mutate({
        ...values,
        description: values.description || "",
        assignedToMemberId: values.assignedToMemberId || null,
        dueAt: values.dueAt || null,
      });

      toastSuccess("Task created", `${task.key} is ready.`);

      await onTaskCreated?.();
      reset();
      setOpen(false);
    } catch (error) {
      toastError(
        "Could not create task",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full sm:w-fit">
            <PlusIcon className="size-4" />
            Create task
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <DialogHeader>
              <DialogTitle>Create task</DialogTitle>
              <DialogDescription>
                Add work to a project and get the next project task key.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <Controller
                name="projectId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Project</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingProjects || !projects.length}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingProjects
                              ? "Loading projects..."
                              : "Select project"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.taskKeyPrefix} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isLoadingProjects && !projects.length && (
                      <p className="text-xs text-muted-foreground">
                        No active projects are available.
                      </p>
                    )}
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="task-name">Task name</FieldLabel>
                    <Input
                      id="task-name"
                      placeholder="e.g., Draft onboarding checklist"
                      {...field}
                    />
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <RichTextEditor
                      value={field.value ?? ""}
                      showActions={false}
                      onChange={field.onChange}
                      onSave={field.onChange}
                      placeholder="Add context, acceptance notes, or links."
                      minHeightClassName="[&_.ProseMirror]:min-h-28"
                    />
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </Field>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="todo">To do</SelectItem>
                          <SelectItem value="in-progress">
                            In progress
                          </SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Priority</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <Controller
                  name="dueAt"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="task-due-date">Due date</FieldLabel>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={getDateInputValue(field.value)}
                        onBlur={field.onBlur}
                        onChange={(event) =>
                          field.onChange(event.target.value || null)
                        }
                      />
                      {fieldState.error && (
                        <p className="text-xs text-destructive">
                          {fieldState.error.message}
                        </p>
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="assignedToMemberId"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Assignee</FieldLabel>
                    <Select
                      value={field.value ?? unassignedValue}
                      onValueChange={(value) =>
                        field.onChange(value === unassignedValue ? null : value)
                      }
                      disabled={isLoadingMembers}
                    >
                      <SelectTrigger className="w-full">
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
                          Unassigned
                        </SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - {member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isLoadingProjects ||
                  isLoadingMembers ||
                  !projects.length ||
                  !isValid
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating task...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create task
                    <ArrowRightIcon className="size-4" />
                  </span>
                )}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};
