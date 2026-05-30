"use client";

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
import { toastSuccess } from "@zentro/ui/index";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { FC, useState } from "react";

type Props = {
  project: {
    name: string;
    slug: string;
    status: string;
  };
};

export const DangerSection: FC<Props> = ({ project }) => {
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");

  const deleteConfirmation = project.slug;
  const isArchived = project.status === "archived";

  const handleArchive = () => {
    toastSuccess("Archived locally", "Connect this to archiveProject next.");
    setIsArchiveDialogOpen(false);
  };

  const handleDelete = () => {
    toastSuccess("Deleted locally", "Connect this to deleteProject next.");
    setIsDeleteDialogOpen(false);
    setTypedConfirmation("");
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
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
                variant="secondary"
                className="mt-5 w-full sm:w-auto"
                onClick={() => setIsArchiveDialogOpen(true)}
              >
                {isArchived ? (
                  <RotateCcwIcon className="size-4" />
                ) : (
                  <ArchiveIcon className="size-4" />
                )}
                {isArchived ? "Restore project" : "Archive project"}
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
                Delete this project when it is no longer needed. For v1 this
                should be a soft delete so the project can be recovered from the
                database if needed.
              </p>
              <Button
                variant="destructive"
                className="mt-5 w-full sm:w-auto"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2Icon className="size-4" />
                Delete project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
                <ArchiveIcon className="size-5 text-primary" />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {isArchived ? "Restore project" : "Archive project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
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
              This will remove {project.name} from normal project views.
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
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={typedConfirmation !== deleteConfirmation}
              onClick={handleDelete}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
