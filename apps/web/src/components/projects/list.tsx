"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  EyeIcon,
  FolderKanbanIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@zentro/ui/shadcn/tabs";

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "Active" | "Archived";
  tasksCount: number;
  docsCount: number;
  members: number;
  updated: string;
};

const projects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    slug: "website-redesign",
    description: "Complete redesign of the company website with modern UI/UX.",
    status: "Active",
    tasksCount: 24,
    docsCount: 8,
    members: 5,
    updated: "Updated 2 hours ago",
  },
  {
    id: "2",
    name: "Mobile App Launch",
    slug: "mobile-app-launch",
    description: "Launch iOS and Android versions of our core product.",
    status: "Active",
    tasksCount: 42,
    docsCount: 15,
    members: 8,
    updated: "Updated 5 hours ago",
  },
  {
    id: "3",
    name: "Internal Knowledge Base",
    slug: "internal-knowledge-base",
    description:
      "Build centralized knowledge repository for team documentation.",
    status: "Archived",
    tasksCount: 12,
    docsCount: 28,
    members: 3,
    updated: "Updated 3 days ago",
  },
];

export const ProjectList = () => {
  const [status, setStatus] = useState("all");

  const filteredProjects = useMemo(() => {
    if (status === "active") {
      return projects.filter((project) => project.status === "Active");
    }

    if (status === "archived") {
      return projects.filter((project) => project.status === "Archived");
    }

    return projects;
  }, [status]);

  return (
    <div className="flex flex-col gap-5">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredProjects.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center sm:p-12">
          <div className="mb-4 flex justify-center">
            <div className="rounded-md bg-secondary p-3">
              <FolderKanbanIcon className="size-8 text-muted-foreground" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            No projects yet
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create a project to start organizing and tracking work across your
            team.
          </p>

          <Button className="mt-6">
            <PlusIcon className="size-4" />
            Create project
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="flex flex-col gap-4 rounded-md border bg-card p-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary">
                    <FolderKanbanIcon className="size-4 text-primary-foreground" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">
                      {project.name}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.slug}
                    </p>
                  </div>
                </div>

                <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                  {project.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      project.status === "Active" ? "default" : "secondary"
                    }
                  >
                    {project.status}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    {project.tasksCount} tasks · {project.docsCount} docs
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground">
                    {project.updated}
                  </p>

                  <div className="mt-2 flex -space-x-2 sm:justify-end">
                    {Array.from({ length: Math.min(project.members, 3) }).map(
                      (_, index) => (
                        <Avatar
                          key={index}
                          className="size-6 border border-background"
                        >
                          <AvatarFallback className="text-xs">
                            {String.fromCharCode(65 + index)}
                          </AvatarFallback>
                        </Avatar>
                      ),
                    )}

                    {project.members > 3 ? (
                      <div className="flex size-6 items-center justify-center rounded-full border border-background bg-secondary text-xs font-medium text-muted-foreground">
                        +{project.members - 3}
                      </div>
                    ) : null}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(event) => event.preventDefault()}
                    >
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open project actions</span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.slug}`}>
                        <EyeIcon className="size-4" />
                        View
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.slug}/settings`}>
                        <SettingsIcon className="size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem>
                      <ArchiveIcon className="size-4" />
                      Archive
                    </DropdownMenuItem>

                    <DropdownMenuItem variant="destructive">
                      <Trash2Icon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
