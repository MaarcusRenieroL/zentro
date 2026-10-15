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
import { Input } from "@zentro/ui/components/shadcn/input";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { ArchiveIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

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
  const [counts, setCounts] = useState<{
    tasks: number;
    open: number;
    docs: number;
  } | null>(null);

  useEffect(() => {
    let live = true;

    trpc.project.getProjectBySlug
      .query({ slug: project.slug })
      .then((data) => {
        if (live) {
          setCounts({
            tasks: data.totalTasks,
            open: data.openTasks,
            docs: data.totalDocs,
          });
        }
      })
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [project.slug, trpc]);

  // Typing the name, not the slug: the name is what people recognise.
  const deleteConfirmation = project.name;
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

  const row =
    "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6";

  return (
    <div className="flex max-w-[860px] flex-col">
      <section
        aria-label="Danger zone"
        className="overflow-hidden rounded-xl border border-danger/40 bg-surface"
      >
        <div className={row}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold">
              {isArchived ? "Restore project" : "Archive project"}
            </h2>
            <p className="text-[13px] text-ink-2">
              {isArchived
                ? `Brings ${project.name} back to Projects and makes its tasks editable again.`
                : `Hides ${project.name} from active Projects. You can restore it any time.`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0 border-hairline bg-transparent px-3"
            onClick={() => setIsArchiveDialogOpen(true)}
            disabled={isArchiving || isDeleting}
          >
            {isArchived ? (
              <RotateCcwIcon className="size-4" />
            ) : (
              <ArchiveIcon className="size-4" />
            )}
            {isArchived ? "Restore project" : "Archive project"}
          </Button>
        </div>
        <div className={`${row} border-t border-hairline`}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold">Delete project</h2>
            <p className="text-[13px] text-ink-2">
              Deletes {project.name}
              {counts
                ? `, its ${counts.tasks} ${counts.tasks === 1 ? "task" : "tasks"} and ${counts.docs} ${counts.docs === 1 ? "doc" : "docs"}`
                : ""}{" "}
              for everyone. This can’t be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0 border-danger/50 bg-transparent px-3 text-danger-text hover:bg-danger-subtle"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isArchiving || isDeleting}
          >
            <Trash2Icon className="size-4" />
            Delete project
          </Button>
        </div>
      </section>

      <AlertDialog
        open={isArchiveDialogOpen}
        onOpenChange={(open) => {
          if (isArchiving) return;
          setIsArchiveDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchived
                ? `Restore ${project.name}?`
                : `Archive ${project.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived
                ? `${project.name} will be active again.`
                : `${project.name} moves out of active work. Nothing is deleted.`}
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
            <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the project for everyone. It can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {counts ? (
            <ul className="flex flex-col gap-1.5 rounded-md border border-hairline px-4 py-3 text-sm">
              <li className="flex gap-3">
                <span className="w-8 text-right font-mono">{counts.tasks}</span>
                tasks, including {counts.open} open
              </li>
              <li className="flex gap-3">
                <span className="w-8 text-right font-mono">{counts.docs}</span>
                docs and their comments
              </li>
            </ul>
          ) : null}

          <label className="flex flex-col gap-1.5 text-[13px]">
            <span>
              Type{" "}
              <span className="font-mono font-semibold text-ink">
                {deleteConfirmation}
              </span>{" "}
              to confirm
            </span>
            <Input
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              aria-label={`Type ${deleteConfirmation} to confirm`}
              autoComplete="off"
              className="h-11 rounded-md border-hairline text-[15px]"
              disabled={isDeleting}
            />
          </label>

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
