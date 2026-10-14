"use client";

import { paths } from "~/src/lib/paths";
import { useTrpcClient } from "@zentro/api/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zentro/ui/components/shadcn/alert-dialog";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
import { Input } from "@zentro/ui/components/shadcn/input";
import { toastError, toastSuccess } from "@zentro/ui/index";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";

type ProjectStatus = "active" | "archived";

type Props = {
  project: {
    name: string;
    slug: string;
    status: ProjectStatus;
  };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;

  return "Something went wrong. Please try again.";
};

const isProjectStatus = (status: string): status is ProjectStatus => {
  return status === "active" || status === "archived";
};

export const DangerSection: FC<Props> = ({ project }) => {
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(
    project.status,
  );
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const trpc = useTrpcClient();
  const router = useRouter();

  const deleteConfirmation = project.slug;
  const isArchived = projectStatus === "archived";
  const isDeleteConfirmed = typedConfirmation === deleteConfirmation;

  const handleArchiveToggle = async () => {
    try {
      setIsArchiving(true);

      const updatedProject = await trpc.project.archiveProject.mutate({
        slug: project.slug,
      });

      if (!isProjectStatus(updatedProject.status)) {
        throw new Error("Invalid project status returned from server.");
      }

      setProjectStatus(updatedProject.status);

      toastSuccess(
        updatedProject.status === "archived"
          ? "Project archived"
          : "Project restored",
        updatedProject.status === "archived"
          ? "This project is now archived."
          : "This project is active again.",
      );

      setIsArchiveDialogOpen(false);
      router.refresh();
    } catch (error) {
      toastError(
        isArchived ? "Restore failed" : "Archive failed",
        getErrorMessage(error),
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await trpc.project.deleteProject.mutate({
        slug: project.slug,
      });

      toastSuccess("Project deleted", "This project was permanently deleted.");

      setIsDeleteDialogOpen(false);
      setTypedConfirmation("");

      router.replace(paths.projects());
      router.refresh();
    } catch (error) {
      toastError("Delete failed", getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl py-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sunken">
              {isArchived ? (
                <RotateCcwIcon className="size-5 text-primary" />
              ) : (
                <ArchiveIcon className="size-5 text-primary" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {isArchived ? "Restore project" : "Archive project"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {isArchived
                  ? "Restoring makes this project active again and available for normal work."
                  : "Archived projects stay available for reference, but new work should happen in active projects."}
              </p>

              <Button
                type="button"
                variant="secondary"
                className="mt-5 w-full sm:w-auto"
                onClick={() => setIsArchiveDialogOpen(true)}
                disabled={isArchiving || isDeleting}
              >
                {isArchived ? (
                  <RotateCcwIcon className="size-4" />
                ) : (
                  <ArchiveIcon className="size-4" />
                )}

                {isArchiving
                  ? isArchived
                    ? "Restoring..."
                    : "Archiving..."
                  : isArchived
                    ? "Restore project"
                    : "Archive project"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-destructive/30 bg-destructive/5 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
              <Trash2Icon className="size-5 text-destructive" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Delete project
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Delete this project when it is no longer needed. This action
                permanently removes the project and cannot be undone.
              </p>

              <Button
                type="button"
                variant="destructive"
                className="mt-5 w-full sm:w-auto"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isArchiving || isDeleting}
              >
                <Trash2Icon className="size-4" />
                {isDeleting ? "Deleting..." : "Delete project"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={isArchiveDialogOpen}
        onOpenChange={(open) => {
          if (isArchiving) return;
          setIsArchiveDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sunken">
                {isArchived ? (
                  <RotateCcwIcon className="size-5 text-primary" />
                ) : (
                  <ArchiveIcon className="size-5 text-primary" />
                )}
              </div>

              <AlertDialogTitle>
                {isArchived ? "Restore project?" : "Archive project?"}
              </AlertDialogTitle>
            </div>

            <AlertDialogDescription>
              {isArchived
                ? `${project.name} will become active again.`
                : `${project.name} will be moved out of active work.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleArchiveToggle}
              disabled={isArchiving}
            >
              {isArchiving
                ? isArchived
                  ? "Restoring..."
                  : "Archiving..."
                : isArchived
                  ? "Restore project"
                  : "Archive project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (isDeleting) return;

          setIsDeleteDialogOpen(open);

          if (!open) {
            setTypedConfirmation("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className="flex size-9 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangleIcon className="size-5 text-destructive" />
              </div>

              <AlertDialogTitle>Delete project?</AlertDialogTitle>
            </div>

            <AlertDialogDescription>
              This will permanently delete {project.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <p className="mt-4 text-sm text-muted-foreground">
            Type{" "}
            <span className="rounded bg-secondary px-1.5 py-1 font-mono text-xs text-foreground">
              {deleteConfirmation}
            </span>{" "}
            to confirm.
          </p>

          <Input
            value={typedConfirmation}
            onChange={(event) => setTypedConfirmation(event.target.value)}
            placeholder="Type project slug"
            className="mt-3"
            disabled={isDeleting}
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!isDeleteConfirmed || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
