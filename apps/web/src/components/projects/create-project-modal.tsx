"use client";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@zentro/ui/shadcn/dialog";
import { ArrowRight, Check, PlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  CreateProjectFormValues,
  createProjectSchema,
} from "@zentro/api/types/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@zentro/ui/shadcn/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { useSlugAvailability } from "@zentro/ui/hooks/use-slug-availability";
import { useTrpcClient } from "@zentro/api/react";
import { useCallback, useEffect, useState } from "react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { LoadingState } from "@zentro/ui/components/loading-state";
import { slugify, slugifyInput } from "@zentro/utils";

type CreateProjectModalProps = {
  onProjectCreated: () => void | Promise<void>;
};

type TeamOption = {
  id: string;
  name: string;
  color: string;
};

const CreateProjectModalInner = ({
  onProjectCreated,
}: CreateProjectModalProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  const trpc = useTrpcClient();

  const checkProjectSlug = useCallback(
    async (slug: string) => {
      const result = await trpc.project.checkSlug.query({
        slug,
      });

      return result.available;
    },
    [trpc],
  );

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      teamId: null,
    },
    mode: "onChange",
  });

  const slug = useWatch({ control, name: "slug" }) ?? "";

  const { isChecking, visibleAvailability } = useSlugAvailability({
    slug,
    checkSlug: checkProjectSlug,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadTeams() {
      setIsLoadingTeams(true);

      try {
        const teamList = await trpc.team.getAll.query();

        if (!cancelled) {
          setTeams(teamList);
        }
      } catch {
        if (!cancelled) {
          toastError("Error", "Could not load teams");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTeams(false);
        }
      }
    }

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, [open, trpc]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset();
      setSlugEdited(false);
    }
  };

  const onSubmit = async (formValues: CreateProjectFormValues) => {
    if (visibleAvailability !== true) {
      return;
    }

    try {
      await trpc.project.createProject.mutate({
        name: formValues.name,
        slug: formValues.slug,
        description: formValues.description,
        teamId: formValues.teamId ?? null,
      });

      toastSuccess("Success", "Project created successfully");

      await onProjectCreated();
      reset();
      setSlugEdited(false);
      setOpen(false);
    } catch (error) {
      toastError(
        "Error",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusIcon className="h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
              <DialogDescription>
                Create a new project to organize work and collaborate with your
                team.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="project-name">
                        Project name
                      </FieldLabel>
                      <Input
                        id="project-name"
                        placeholder="e.g., Website Redesign"
                        className="mt-1.5"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          field.onChange(event);

                          if (!slugEdited) {
                            setValue("slug", slugify(event.target.value), {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                      <FieldDescription>
                        This is how your project will appear to members.
                      </FieldDescription>

                      {fieldState.error && (
                        <p className="mt-2 text-xs text-red-400">
                          {fieldState.error.message}
                        </p>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="slug"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="project-slug">Slug</FieldLabel>
                      <div className="relative mt-1.5">
                        <Input
                          id="project-slug"
                          placeholder="website-redesign"
                          className="pr-10"
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => {
                            setSlugEdited(true);
                            field.onChange(slugifyInput(event.target.value));
                          }}
                        />
                        {slug && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {isChecking ? (
                              <LoadingState
                                label="Checking project slug"
                                className="min-h-0"
                                showLabel={false}
                              />
                            ) : visibleAvailability ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : visibleAvailability === false ? (
                              <span className="text-xs text-destructive">
                                Taken
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      <FieldDescription>
                        This is how your project slug will appear to members.
                      </FieldDescription>

                      {fieldState.error && (
                        <p className="mt-2 text-xs text-red-400">
                          {fieldState.error.message}
                        </p>
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="project-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      id="project-description"
                      placeholder="Brief description of the project..."
                      className="mt-1.5"
                      rows={3}
                      {...field}
                    />

                    {fieldState.error && (
                      <p className="mt-2 text-xs text-red-400">
                        {fieldState.error.message}
                      </p>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="teamId"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="project-team">Team</FieldLabel>
                    <Select
                      value={field.value ?? "workspace"}
                      onValueChange={(value) =>
                        field.onChange(value === "workspace" ? null : value)
                      }
                      disabled={isLoadingTeams}
                    >
                      <SelectTrigger id="project-team" className="mt-1.5">
                        <SelectValue
                          placeholder={
                            isLoadingTeams ? "Loading teams..." : "Select team"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workspace">
                          Workspace level
                        </SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Projects assigned to a team will scope their tasks and
                      docs to that team.
                    </FieldDescription>
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
                  !isValid ||
                  isChecking ||
                  visibleAvailability !== true
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating project...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create project
                    <ArrowRight className="h-4 w-4" />
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

export const CreateProjectModal = (props: CreateProjectModalProps) => {
  const canCreate = usePermission("projects.create");

  return canCreate ? <CreateProjectModalInner {...props} /> : null;
};
