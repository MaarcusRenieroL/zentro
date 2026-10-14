"use client";

import { useReachable } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";
import { Button } from "@zentro/ui/shadcn/button";
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
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentProps, FormEvent } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import { createDocSlug } from "../../../lib/docs";

type CreateDocModalProps = {
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  /** Control the dialog from outside (the Create menu), with no trigger button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

function CreateDocModalInner({
  triggerLabel = "New doc",
  triggerVariant,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: CreateDocModalProps) {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [projectId, setProjectId] = useState("workspace");
  const [teamId, setTeamId] = useState("workspace");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    async function fetchOptions() {
      try {
        const [projectList, teamList] = await Promise.all([
          // Docs work without the Projects module.
          trpc.project.getProjectsByOrgId.query().catch(() => []),
          // Needs teams.view; without it the doc simply has no team to pick.
          trpc.team.getAll.query().catch(() => []),
        ]);

        if (isMounted) {
          setProjects(projectList);
          setTeams(teamList);
        }
      } catch (error) {
        toastError(error, "Failed to load doc options");
      }
    }

    void fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [open, trpc]);

  async function handleCreateDoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    try {
      setIsCreating(true);

      const docTitle = title.trim() || "Untitled";
      const slug = `${createDocSlug(docTitle)}-${Date.now().toString(36)}`;
      const doc = await trpc.docs.create.mutate({
        title: docTitle,
        content,
        projectId: projectId === "workspace" ? null : projectId,
        teamId:
          projectId === "workspace" && teamId !== "workspace" ? teamId : null,
        slug,
      });

      toastSuccess("Doc created", doc.title);
      setOpen(false);
      setProjectId("workspace");
      setTeamId("workspace");
      setTitle("");
      setContent("");
      router.push(paths.doc(doc.slug));
    } catch (error) {
      toastError(error, "Failed to create doc");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button variant={triggerVariant}>
            <PlusIcon className="size-4" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create doc</DialogTitle>
          <DialogDescription>
            Start a workspace page and connect it to a project when needed.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleCreateDoc}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem_12rem]">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  placeholder="Untitled product note"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workspace">Workspace</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Team</FieldLabel>
                <Select
                  value={teamId}
                  onValueChange={setTeamId}
                  disabled={projectId !== "workspace"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workspace">Workspace</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {projectId !== "workspace" ? (
                  <p className="text-xs text-muted-foreground">
                    Project docs inherit their project team.
                  </p>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel>Initial content</FieldLabel>
              <Textarea
                className="min-h-28 resize-none"
                placeholder="Add the first paragraph, or leave it blank."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              <PlusIcon className="size-4" />
              {isCreating ? "Creating..." : "Create doc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateDocModal(props: CreateDocModalProps) {
  // A role on one project is enough; the server checks each project.
  const canCreate = useReachable("docs.create");

  return canCreate ? <CreateDocModalInner {...props} /> : null;
}
