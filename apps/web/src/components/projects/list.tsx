"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";

type ProjectListProps = {
  isLoading: boolean;
  projects: DbProject[];
  searchQuery: string;
  sortBy: "updated" | "name" | "status";
  initialStatus: "all" | "active" | "archived";
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
  sortBy,
  initialStatus,
}: ProjectListProps) => {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const filteredProjects = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesStatus = status === "all" || project.status === status;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          project.name.toLowerCase().includes(normalizedSearchQuery) ||
          project.slug.toLowerCase().includes(normalizedSearchQuery) ||
          (project.description ?? "")
            .toLowerCase()
            .includes(normalizedSearchQuery);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sortBy === "status") {
          return (
            a.status.localeCompare(b.status) || a.name.localeCompare(b.name)
          );
        }

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }, [projects, searchQuery, sortBy, status]);

  const emptyTitle = searchQuery.trim()
    ? "No matching projects"
    : "No projects yet";

  const emptyDescription = searchQuery.trim()
    ? "Try a different project name, slug, or description."
    : "Create a project to start organizing and tracking work across your team.";

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        value={status}
        onValueChange={(value) =>
          setStatus(value as "all" | "active" | "archived")
        }
      >
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-44 max-w-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-4 w-full max-w-lg" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          ))}
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
                    Project workspace
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatUpdatedAt(project.updatedAt)}
                  </p>

                  <Avatar className="mt-2 size-6 border border-background sm:ml-auto">
                    <AvatarFallback className="text-xs">
                      {project.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        router.push(`/projects/${project.slug}`);
                      }}
                    >
                      <EyeIcon className="size-4" />
                      View
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        router.push(`/projects/${project.slug}/settings`);
                      }}
                    >
                      <SettingsIcon className="size-4" />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(event) => {
                        event.preventDefault();
                        router.push(
                          `/projects/${project.slug}/settings/danger`,
                        );
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      Danger zone
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
