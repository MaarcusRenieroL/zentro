"use client";

import { paths } from "~/src/lib/paths";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTrpcClient } from "@zentro/api/react";
import { Badge } from "@zentro/ui/components/shadcn/badge";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
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
import { toastError, toastSuccess } from "@zentro/ui/index";
import {
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  RotateCcwIcon,
  RocketIcon,
  UsersIcon,
  UserIcon,
} from "lucide-react";
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
    formState: { errors, isDirty, isSubmitting },
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

  return (
    <form
      noValidate
      className="space-y-6 pb-24"
      onSubmit={handleSubmit(handleSave)}
    >
      {saveState === "saved" ? (
        <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success-subtle px-4 py-3 text-sm text-foreground">
          <CheckCircle2Icon className="size-4 text-success" />
          Project settings saved.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="max-w-xl space-y-5">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.name)}
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);
                      setSaveState("idle");
                    }}
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="project-slug">Slug</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-sm text-muted-foreground">
                      /projects/
                    </span>
                    <Input
                      id="project-slug"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.slug)}
                      className="sm:max-w-sm"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        setSaveState("idle");
                      }}
                    />
                  </div>
                  {errors.slug ? (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Lowercase letters, numbers, and hyphens only.
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    rows={5}
                    aria-invalid={Boolean(errors.description)}
                    placeholder="What is this project for?"
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);
                      setSaveState("idle");
                    }}
                  />
                  {errors.description ? (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keep it short. This appears on the project overview.
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="project-team">Team</Label>
                  <Select
                    value={field.value ?? "workspace"}
                    onValueChange={(value) => {
                      field.onChange(value === "workspace" ? null : value);
                      setSaveState("idle");
                    }}
                    disabled={isLoadingTeams}
                  >
                    <SelectTrigger id="project-team" className="sm:max-w-sm">
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
                  <p className="text-sm text-muted-foreground">
                    Tasks and docs created under this project inherit this team.
                  </p>
                </div>
              )}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-xl py-0">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <EyeIcon className="size-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">
                  Preview
                </h2>
              </div>

              <div className="rounded-xl border border-hairline/60 bg-surface/50 p-4">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-sunken">
                  <RocketIcon className="size-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-2xl text-ink">
                    {preview.name || "Untitled project"}
                  </h3>
                  <Badge
                    variant={
                      project.status === "active" ? "default" : "secondary"
                    }
                  >
                    {project.status === "active" ? "Active" : "Archived"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {preview.slug || "project-slug"}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {preview.description || "No description provided."}
                </p>
                <Badge variant="outline" className="mt-3">
                  {previewTeam?.name ?? project.teamName ?? "Workspace level"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-0">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-foreground">
                Metadata
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <UserIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Owner</p>
                    <p className="truncate font-medium text-foreground">
                      {project.owner}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UsersIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Team</p>
                    <p className="truncate font-medium text-foreground">
                      {project.teamName ?? "Workspace level"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-medium text-foreground">
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {isDirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes.
            </p>
            <div className="grid gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <RotateCcwIcon className="size-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <CheckCircle2Icon className="size-4" />
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
};
