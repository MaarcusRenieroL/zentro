"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  EyeIcon,
  FolderKanbanIcon,
  MoreHorizontalIcon,
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
import type { Project as DbProject } from "@zentro/db/schema";

type ProjectListProps = {
  isLoading: boolean;
  projects: DbProject[];
  searchQuery: string;
};

function formatProjectStatus(status: string) {
  return status === "archived" ? "Archived" : "Active";
}

function formatUpdatedAt(updatedAt: Date) {
  return `Updated ${updatedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      updatedAt.getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  })}`;
}

export const ProjectList = ({
  isLoading,
  projects,
  searchQuery,
}: ProjectListProps) => {
  const [status, setStatus] = useState("all");

  const filteredProjects = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus = status === "all" || project.status === status;
      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearchQuery) ||
        project.slug.toLowerCase().includes(normalizedSearchQuery) ||
        (project.description ?? "")
          .toLowerCase()
          .includes(normalizedSearchQuery);

      return matchesStatus && matchesSearch;
    });
  }, [projects, searchQuery, status]);

  const emptyTitle = searchQuery.trim()
    ? "No matching projects"
    : "No projects yet";

  const emptyDescription = searchQuery.trim()
    ? "Try a different project name, slug, or description."
    : "Create a project to start organizing and tracking work across your team.";

  return (
    <div className="flex flex-col gap-5">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground sm:p-12">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center sm:p-12">
          <div className="mb-4 flex justify-center">
            <div className="rounded-md bg-secondary p-3">
              <FolderKanbanIcon className="size-8 text-muted-foreground" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            {emptyTitle}
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {emptyDescription}
          </p>
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
                  {project.description || "No description provided."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      project.status === "active" ? "default" : "secondary"
                    }
                  >
                    {formatProjectStatus(project.status)}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    0 tasks · 0 docs
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatUpdatedAt(project.updatedAt)}
                  </p>

                  <div className="mt-2 flex -space-x-2 sm:justify-end">
                    {Array.from({ length: 1 }).map((_, index) => (
                      <Avatar
                        key={index}
                        className="size-6 border border-background"
                      >
                        <AvatarFallback className="text-xs">
                          {String.fromCharCode(65 + index)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
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
