"use client";

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
};

export function CreateDocModal({
  triggerLabel = "New doc",
  triggerVariant,
}: CreateDocModalProps) {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [projectId, setProjectId] = useState("workspace");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    async function fetchProjects() {
      try {
        const projectList = await trpc.project.getProjectsByOrgId.query();

        if (isMounted) {
          setProjects(projectList);
        }
      } catch (error) {
        toastError(error, "Failed to load projects");
      }
    }

    void fetchProjects();

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
        slug,
      });

      toastSuccess("Doc created", doc.title);
      setOpen(false);
      router.push(`/docs/${doc.slug}`);
    } catch (error) {
      toastError(error, "Failed to create doc");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>
          <PlusIcon className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create doc</DialogTitle>
          <DialogDescription>
            Start a workspace page and connect it to a project when needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateDoc}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
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
