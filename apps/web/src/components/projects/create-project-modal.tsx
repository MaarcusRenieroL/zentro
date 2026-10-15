"use client";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";
import { Kbd } from "@zentro/ui/components/kbd";
import { Check, PlusIcon, XIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  CreateProjectFormValues,
  createProjectSchema,
} from "@zentro/api/types/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { cn, toastError, toastSuccess } from "@zentro/ui/index";
import { LoadingState } from "@zentro/ui/components/loading-state";
import { slugify, slugifyInput } from "@zentro/utils";

type CreateProjectModalProps = {
  onProjectCreated: () => void | Promise<void>;
  /** Control the dialog from outside (the Create menu), with no trigger button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

type TeamOption = {
  id: string;
  name: string;
  color: string;
};

const CreateProjectModalInner = ({
  onProjectCreated,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: CreateProjectModalProps) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
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
    formState: { isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      teamId: null,
    },
    mode: "onTouched",
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

  const submit = handleSubmit(onSubmit);
  const prefix = keyPrefixFor(slug);
  const box =
    "h-11 rounded-md border-hairline bg-surface text-[15px] shadow-none";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button className="h-10 px-3.5 font-semibold">
            <PlusIcon />
            New project
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        showCloseButton={false}
        className="gap-0 p-0 sm:max-w-[560px]"
      >
        <form
          noValidate
          onSubmit={submit}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        >
          <div className="flex items-center gap-2.5 pt-4 pr-4 pb-2 pl-6">
            <DialogTitle className="text-lg font-semibold">
              New project
            </DialogTitle>
            <span className="flex-1" />
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" className="size-8">
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
            <DialogDescription className="sr-only">
              A project groups tasks and docs under one key, such as ZEN-1.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-4 px-6 pt-2 pb-5">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="project-name"
                    className="text-[13px] font-medium"
                  >
                    Name
                  </label>
                  <Input
                    id="project-name"
                    placeholder="Marketing Site"
                    className={box}
                    aria-invalid={Boolean(fieldState.error)}
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
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
            />

            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="project-slug"
                    className="text-[13px] font-medium"
                  >
                    URL
                  </label>
                  <div
                    className={cn(
                      "flex h-11 items-center gap-1 rounded-md border bg-surface pr-3 pl-3 focus-within:ring-[3px]",
                      visibleAvailability === false || fieldState.error
                        ? "border-danger focus-within:ring-danger/22"
                        : "border-hairline focus-within:border-signal focus-within:ring-ring/22",
                    )}
                  >
                    <span className="shrink-0 font-mono text-[13px] text-ink-3">
                      /projects/
                    </span>
                    <input
                      id="project-slug"
                      placeholder="marketing-site"
                      aria-invalid={
                        visibleAvailability === false ||
                        Boolean(fieldState.error)
                      }
                      className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-ink-3"
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        setSlugEdited(true);
                        field.onChange(slugifyInput(event.target.value));
                      }}
                    />
                    {slug ? (
                      isChecking ? (
                        <LoadingState
                          label="Checking project URL"
                          className="min-h-0"
                          showLabel={false}
                        />
                      ) : visibleAvailability ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs text-success-text">
                          <span className="flex size-3.5 items-center justify-center rounded-full bg-success text-on-success">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                          Available
                        </span>
                      ) : visibleAvailability === false ? (
                        <span className="font-mono text-xs text-danger-text">
                          Taken
                        </span>
                      ) : null
                    ) : null}
                  </div>
                  {fieldState.error ? (
                    <FieldError message={fieldState.error.message} />
                  ) : visibleAvailability === false ? (
                    <FieldError message="Another project uses this URL. Add a word, like marketing-site-2." />
                  ) : (
                    <p className="text-[13px] text-ink-3">
                      Checked as you type. You can change it later in project
                      settings.
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="project-description"
                    className="text-[13px] font-medium"
                  >
                    Description{" "}
                    <span className="font-normal text-ink-3">optional</span>
                  </label>
                  <Textarea
                    id="project-description"
                    placeholder="What is this project for?"
                    className="min-h-[72px] rounded-md border-hairline bg-surface text-[15px] shadow-none"
                    rows={2}
                    {...field}
                  />
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
            />

            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="project-team"
                    className="text-[13px] font-medium"
                  >
                    Team
                  </label>
                  <Select
                    value={field.value ?? "workspace"}
                    onValueChange={(value) => {
                      if (value === "") return;
                      field.onChange(value === "workspace" ? null : value);
                    }}
                    disabled={isLoadingTeams}
                  >
                    <SelectTrigger
                      id="project-team"
                      className={cn(
                        box,
                        "w-full justify-start gap-2.5 data-[size=default]:h-11 [&>svg:last-child]:ml-auto",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-[3px] border border-hairline bg-tint-teams"
                      />
                      <SelectValue
                        placeholder={
                          isLoadingTeams ? "Loading teams..." : "Select team"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workspace">Workspace level</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <div className="flex items-center gap-2.5 border-t border-hairline py-3.5 pr-4 pl-6">
            <span className="truncate text-[13px] text-ink-3">
              {prefix
                ? `Tasks will be numbered ${prefix}-1, ${prefix}-2…`
                : "Tasks here get a key like ZEN-1."}
            </span>
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
              disabled={
                isSubmitting || isChecking || visibleAvailability !== true
              }
              className="h-10 px-3.5 font-semibold"
            >
              Create project
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

/** The key prefix the server will try first, mirrored for the footer. */
function keyPrefixFor(slug: string) {
  const parts = slug.split("-").filter(Boolean);

  if (!parts.length) return null;

  const prefix =
    parts.length > 1
      ? parts.map((part) => part[0]).join("")
      : parts[0]!.slice(0, 6);

  return prefix.replace(/[^a-z0-9]/gi, "").toUpperCase() || null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="flex gap-1.5 text-[13px] text-danger-text">
      <span aria-hidden="true" className="font-mono font-medium">
        !
      </span>
      {message}
    </p>
  );
}

export const CreateProjectModal = (props: CreateProjectModalProps) => {
  const canCreate = usePermission("projects.create");

  return canCreate ? <CreateProjectModalInner {...props} /> : null;
};
