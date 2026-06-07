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
import {
  BookOpenIcon,
  Code2Icon,
  FileTextIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import { createDocSlug } from "../../../lib/docs";

const templates = [
  {
    id: "blank",
    title: "Blank page",
    description: "Start from an empty document.",
    icon: FileTextIcon,
  },
  {
    id: "spec",
    title: "Product spec",
    description: "Problem, goals, scope, and decisions.",
    icon: BookOpenIcon,
  },
  {
    id: "api",
    title: "API doc",
    description: "Endpoints, examples, and errors.",
    icon: Code2Icon,
  },
];

export function CreateDocModal() {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
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
        <Button>
          <PlusIcon className="size-4" />
          New doc
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create doc</DialogTitle>
          <DialogDescription>
            Create a page for decisions, specs, APIs, or handoff notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateDoc}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  placeholder="API documentation"
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
              <FieldLabel>Description</FieldLabel>
              <Textarea
                className="min-h-20"
                placeholder="A short note about what this page covers."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </Field>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SparklesIcon className="size-4 text-primary" />
                Template
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <template.icon className="mb-3 size-5 text-primary" />
                    <p className="text-sm font-medium">{template.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
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
