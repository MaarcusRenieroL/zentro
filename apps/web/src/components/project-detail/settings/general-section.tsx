"use client";

import { paths } from "~/src/lib/paths";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Label } from "@zentro/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import { Textarea } from "@zentro/ui/components/shadcn/textarea";
import { cn, toastError, toastSuccess } from "@zentro/ui/index";
import { CheckCircle2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  ProjectGeneralSectionFormValues,
  projectGeneralSectionSchema,
} from "~/src/lib/zod-schema";

type Props = {
  project: {
    name: string;
    slug: string;
    description: string | null;
    teamId: string | null;
    teamName: string | null;
    teamColor: string | null;
    status: string;
    owner: string;
    taskKeyPrefix?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

type TeamOption = {
  id: string;
  name: string;
  color: string;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;

  return "Something went wrong. Please try again.";
};

export const GeneralSection: FC<Props> = ({ project }) => {
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const trpc = useTrpcClient();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<ProjectGeneralSectionFormValues>({
    resolver: zodResolver(projectGeneralSectionSchema),
    defaultValues: {
      name: project.name,
      slug: project.slug,
      description: project.description ?? "",
      teamId: project.teamId,
    },
    mode: "onTouched",
  });

  const preview = watch();
  const previewTeam = teams.find((team) => team.id === preview.teamId);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setIsLoadingTeams(true);

      try {
        const teamList = await trpc.team.getAll.query();

        if (!cancelled) {
          setTeams(teamList);
        }
      } catch (error) {
        if (!cancelled) {
          toastError("Failed to load teams", getErrorMessage(error));
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
  }, [trpc]);

  const handleCancel = () => {
    reset({
      name: project.name,
      slug: project.slug,
      description: project.description ?? "",
      teamId: project.teamId,
    });

    setSaveState("idle");
  };

  const handleSave = async (values: ProjectGeneralSectionFormValues) => {
    try {
      const updatedProject = await trpc.project.updateProjectBySlug.mutate({
        currentSlug: project.slug,
        name: values.name,
        slug: values.slug,
        description: values.description,
        teamId: values.teamId ?? null,
      });

      toastSuccess("Success", "Project updated successfully.");

      reset({
        name: updatedProject.name,
        slug: updatedProject.slug,
        description: updatedProject.description ?? "",
        teamId: updatedProject.teamId,
      });

      setSaveState("saved");

      if (updatedProject.slug !== project.slug) {
        router.replace(paths.projectGeneralSettings(updatedProject.slug));
        return;
      }

      window.setTimeout(() => {
        setSaveState("idle");
      }, 2500);
    } catch (error) {
      setSaveState("idle");

      toastError("Failed to update project", getErrorMessage(error));
    }
  };

  const changed = (
    [
      ["name", "the name"],
      ["slug", "the URL"],
      ["description", "the description"],
      ["teamId", "the team"],
    ] as const
  )
    .filter(([key]) => dirtyFields[key])
    .map(([, label]) => label);
  const changedText =
    changed.length > 1
      ? `${changed.slice(0, -1).join(", ")} and ${changed[changed.length - 1]}`
      : changed[0];
  const fieldBox = (invalid: boolean) =>
    cn(
      "h-11 rounded-md border-hairline bg-surface text-[15px] shadow-none",
      invalid && "border-danger",
    );
  const descriptionLength = (preview.description ?? "").length;

  return (
    <form
      noValidate
      className="flex flex-col gap-6 pb-6"
      onSubmit={handleSubmit(handleSave)}
    >
      {saveState === "saved" ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-md border border-success/30 bg-success-subtle px-4 py-3 text-sm"
        >
          <CheckCircle2Icon className="size-4 text-success" />
          Project settings saved.
        </div>
      ) : null}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex max-w-[620px] flex-col gap-5">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-name" className="text-[13px]">
                  Name
                </Label>
                <Input
                  id="project-name"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                  className={fieldBox(Boolean(errors.name))}
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    setSaveState("idle");
                  }}
                />
                <FieldError message={errors.name?.message} />
              </div>
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-slug" className="text-[13px]">
                  URL
                </Label>
                <div
                  className={cn(
                    "flex h-11 items-center rounded-md border bg-surface pl-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/22",
                    errors.slug ? "border-danger" : "border-hairline",
                  )}
                >
                  <span className="shrink-0 font-mono text-[13px] text-ink-3">
                    /projects/
                  </span>
                  <input
                    id="project-slug"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.slug)}
                    className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-1 font-mono text-sm outline-none"
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);
                      setSaveState("idle");
                    }}
                  />
                </div>
                {errors.slug ? (
                  <FieldError message={errors.slug.message} />
                ) : (
                  <p className="text-[13px] text-ink-3">
                    Lowercase letters, numbers and hyphens. Changing it changes
                    the project’s address.
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-description" className="text-[13px]">
                  Description
                </Label>
                <Textarea
                  id="project-description"
                  rows={3}
                  aria-invalid={Boolean(errors.description)}
                  placeholder="What is this project for?"
                  className="min-h-20 rounded-md border-hairline bg-surface text-[15px] shadow-none"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    setSaveState("idle");
                  }}
                />
                {errors.description ? (
                  <FieldError message={errors.description.message} />
                ) : (
                  <p className="text-[13px] text-ink-3">
                    Shown on the project tile and overview.{" "}
                    {descriptionLength.toLocaleString()} characters.
                  </p>
                )}
              </div>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="project-team" className="text-[13px]">
                    Team
                  </Label>
                  <Select
                    value={field.value ?? "workspace"}
                    onValueChange={(value) => {
                      if (value === "") return;
                      field.onChange(value === "workspace" ? null : value);
                      setSaveState("idle");
                    }}
                    disabled={isLoadingTeams}
                  >
                    <SelectTrigger
                      id="project-team"
                      className="h-11 w-full justify-start gap-2.5 rounded-md border-hairline bg-surface text-[15px] shadow-none data-[size=default]:h-11 [&>svg:last-child]:ml-auto"
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
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Key prefix</span>
              <span className="flex h-11 items-center rounded-md border border-hairline bg-sunken px-3 font-mono text-sm text-ink-2">
                {project.taskKeyPrefix ?? "None"}
              </span>
            </div>
          </div>
          <p className="-mt-2 text-[13px] text-ink-3">
            Tasks and docs created here inherit the team. The key prefix is set
            when the project is created, so task keys never change.
          </p>
        </div>

        <aside className="flex flex-col gap-3">
          <span className="eyebrow">Preview</span>
          <div className="tile overflow-hidden">
            <div className="flex h-14 items-center gap-2.5 bg-tint-projects px-3.5">
              <span className="flex size-[30px] items-center justify-center rounded-sm border border-hairline bg-tint-chip font-mono text-xs">
                {(preview.name || "?").charAt(0).toUpperCase()}
              </span>
              <span className="inline-flex h-[22px] items-center gap-1.5 rounded-sm border border-hairline bg-tint-chip px-2 text-xs">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full",
                    project.status === "archived"
                      ? "border border-ink-3"
                      : "bg-status-done",
                  )}
                />
                {project.status === "archived" ? "Archived" : "Active"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
              <h3 className="flex items-baseline gap-2 text-base font-semibold">
                <span className="truncate">
                  {preview.name || "Untitled project"}
                </span>
                <span className="font-mono text-xs font-normal text-ink-3">
                  {project.taskKeyPrefix ?? preview.slug}
                </span>
              </h3>
              <p className="line-clamp-3 text-[13px] leading-5 text-ink-2">
                {preview.description || "No description provided."}
              </p>
              <p className="flex items-center gap-2 pt-1 text-[13px] text-ink-2">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-[3px] border border-hairline bg-tint-teams"
                />
                {previewTeam?.name ??
                  (preview.teamId ? project.teamName : null) ??
                  "Workspace level"}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-ink-3">
            How the project appears on the projects list. Created{" "}
            {formatDate(project.createdAt)} by {project.owner}.
          </p>
        </aside>
      </div>

      {isDirty ? (
        <div
          role="status"
          className="sticky bottom-4 z-(--z-sticky) flex max-w-[620px] flex-wrap items-center gap-2.5 rounded-xl border border-hairline bg-overlay py-2.5 pr-2.5 pl-4 shadow-lg motion-safe:animate-fade-up"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-status-progress"
          />
          <span className="text-sm">
            You changed {changedText ?? "this project"}.
          </span>
          <span className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-9 border-hairline bg-transparent px-3"
          >
            Discard
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="h-9 px-3 font-semibold"
          >
            Save changes
          </Button>
        </div>
      ) : null}
    </form>
  );
};

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
