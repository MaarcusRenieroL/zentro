"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGridIcon, ListIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { ErrorState } from "@zentro/ui/components/error-state";
import { cn } from "@zentro/ui/lib/utils";

import { useFavoriteProjects } from "~/src/components/projects/favorites";
import {
  ProjectList,
  type ProjectListItem,
} from "~/src/components/projects/list";
import {
  ProjectToolbar,
  type ProjectSort,
} from "~/src/components/projects/toolbar";

function getStatus(value: string | null) {
  return value === "active" || value === "archived" ? value : "all";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>("updated");
  const [teamFilter, setTeamFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const trpc = useTrpcClient();
  const searchParams = useSearchParams();
  const status = getStatus(searchParams.get("status"));
  const favorites = useFavoriteProjects();

  // The chosen layout is remembered in this browser.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zentro:projects-view");

      if (saved === "list" || saved === "grid") setView(saved);
    } catch {
      // Storage can be blocked; grid is the default.
    }
  }, []);

  const chooseView = (next: "grid" | "list") => {
    setView(next);

    try {
      localStorage.setItem("zentro:projects-view", next);
    } catch {
      // Not fatal.
    }
  };

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      setProjects(await trpc.project.getProjectsByOrgId.query());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [trpc]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const teamOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const project of projects) {
      if (project.teamId && project.teamName) {
        options.set(project.teamId, project.teamName);
      }
    }

    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [projects]);

  const visible = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesStatus = status === "all" || project.status === status;
        const matchesTeam =
          teamFilter === "all" ||
          (teamFilter === "workspace" && !project.teamId) ||
          project.teamId === teamFilter;
        const matchesFavorite =
          !favoritesOnly || favorites.ids.includes(project.id);
        const matchesSearch =
          !needle ||
          [project.name, project.slug, project.teamName, project.description]
            .join(" ")
            .toLowerCase()
            .includes(needle);

        return matchesStatus && matchesTeam && matchesFavorite && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "status") {
          return (
            a.status.localeCompare(b.status) || a.name.localeCompare(b.name)
          );
        }

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }, [
    projects,
    status,
    teamFilter,
    favoritesOnly,
    favorites.ids,
    searchQuery,
    sortBy,
  ]);

  const tabCounts = {
    all: projects.length,
    active: projects.filter((project) => project.status === "active").length,
    archived: projects.filter((project) => project.status === "archived")
      .length,
  };

  const viewControl = (
    <div
      role="radiogroup"
      aria-label="Layout"
      className="flex gap-0.5 rounded-xl border border-hairline bg-surface p-[3px]"
    >
      {(
        [
          ["grid", LayoutGridIcon, "Grid"],
          ["list", ListIcon, "List"],
        ] as const
      ).map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={view === value}
          onClick={() => chooseView(value)}
          className={cn(
            "flex h-[26px] items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
            view === value
              ? "bg-ink text-ink-inverse"
              : "text-ink-2 hover:text-ink",
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="flex w-full flex-col">
      <ProjectToolbar
        searchQuery={searchQuery}
        sortBy={sortBy}
        teamFilter={teamFilter}
        teamOptions={teamOptions}
        favoritesOnly={favoritesOnly}
        count={visible.length}
        tabCounts={tabCounts}
        viewControl={viewControl}
        onSearchQueryChange={setSearchQuery}
        onSortByChange={setSortBy}
        onTeamFilterChange={setTeamFilter}
        onFavoritesOnlyChange={setFavoritesOnly}
        onProjectCreated={loadProjects}
      />
      {failed && !isLoading ? (
        <ErrorState
          title="Projects could not be loaded"
          message="We could not read your projects. They are safe; try again."
          onRetry={loadProjects}
        />
      ) : (
        <ProjectList
          isLoading={isLoading}
          projects={visible}
          view={view}
          hasFilters={Boolean(
            searchQuery.trim() || teamFilter !== "all" || favoritesOnly,
          )}
          favoriteIds={favorites.ids}
          onToggleFavorite={favorites.toggle}
          groupLabel={
            status === "active"
              ? "All active projects"
              : status === "archived"
                ? "Archived projects"
                : "All projects"
          }
        />
      )}
    </section>
  );
}
