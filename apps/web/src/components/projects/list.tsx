"use client";

import { paths } from "~/src/lib/paths";
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

import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";

export type ProjectListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
  status: string;
  updatedAt: Date;
};

type ProjectListProps = {
  isLoading: boolean;
  projects: ProjectListItem[];
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
  const [teamFilter, setTeamFilter] = useState("all");

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const teamOptions = useMemo(() => {
    const options = new Map<string, string>();

    projects.forEach((project) => {
      if (project.teamId && project.teamName) {
        options.set(project.teamId, project.teamName);
      }
    });

    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesStatus = status === "all" || project.status === status;
        const matchesTeam =
          teamFilter === "all" ||
          (teamFilter === "workspace" && !project.teamId) ||
          project.teamId === teamFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          project.name.toLowerCase().includes(normalizedSearchQuery) ||
          project.slug.toLowerCase().includes(normalizedSearchQuery) ||
          (project.teamName ?? "")
            .toLowerCase()
            .includes(normalizedSearchQuery) ||
          (project.description ?? "")
            .toLowerCase()
            .includes(normalizedSearchQuery);

        return matchesStatus && matchesTeam && matchesSearch;
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
  }, [projects, searchQuery, sortBy, status, teamFilter]);

  const hasFilters = searchQuery.trim() || teamFilter !== "all";
  const emptyTitle = hasFilters ? "No matching projects" : "No projects yet";

  const emptyDescription = hasFilters
    ? "Try a different project name, slug, team, or description."
    : "Create a project to start organizing and tracking work across your team.";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="h-(--control-h) w-full rounded-full border-transparent bg-sunken shadow-none hover:bg-hover sm:w-56">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            <SelectItem value="workspace">Workspace level</SelectItem>
            {teamOptions.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-hairline/60"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanbanIcon className="size-4" aria-hidden="true" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-hairline/60 transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal-subtle text-signal">
                  <FolderKanbanIcon className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-ink">
                    <Link
                      href={paths.project(project.slug)}
                      className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
                    >
                      {project.name}
                    </Link>
                  </h3>
                  <p className="truncate font-mono text-xs text-ink-3">
                    {project.slug}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="relative z-[1] -mt-1 -mr-1.5 rounded-full text-ink-2"
                    >
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open project actions</span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        router.push(paths.project(project.slug));
                      }}
                    >
                      <EyeIcon className="size-4" />
                      View
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        router.push(paths.projectSettings(project.slug));
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
                        router.push(paths.projectDangerSettings(project.slug));
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      Danger zone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="line-clamp-2 min-h-10 text-sm text-ink-2">
                {project.description || "No description provided."}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
                <Badge
                  variant={
                    project.status === "active" ? "success" : "secondary"
                  }
                >
                  {formatProjectStatus(project.status)}
                </Badge>
                <span>{project.teamName ?? "Workspace level"}</span>
                <span className="ml-auto text-ink-3">
                  {formatUpdatedAt(project.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
