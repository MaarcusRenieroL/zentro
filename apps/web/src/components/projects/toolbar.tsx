"use client";

import { ArrowDownUpIcon, SearchIcon, StarIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { ModuleTabs } from "~/src/components/shell/module-section-nav";
import { paths } from "~/src/lib/paths";

import { CreateProjectModal } from "./create-project-modal";

export type ProjectSort = "updated" | "name" | "status";

const sortOptions: Array<{ value: ProjectSort; label: string }> = [
  { value: "updated", label: "Last updated" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
];

type ProjectToolbarProps = {
  onProjectCreated: () => void | Promise<void>;
  searchQuery: string;
  sortBy: ProjectSort;
  teamFilter: string;
  teamOptions: Array<{ id: string; name: string }>;
  favoritesOnly: boolean;
  count: number;
  tabCounts: { all: number; active: number; archived: number };
  viewControl: ReactNode;
  onSearchQueryChange: (query: string) => void;
  onSortByChange: (sort: ProjectSort) => void;
  onTeamFilterChange: (team: string) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
};

const chip =
  "h-8 shrink-0 gap-1.5 rounded-xl border-hairline bg-transparent px-2.5 text-[13px] shadow-none data-[size=default]:h-8";

export const ProjectToolbar = ({
  onProjectCreated,
  searchQuery,
  sortBy,
  teamFilter,
  teamOptions,
  favoritesOnly,
  count,
  tabCounts,
  viewControl,
  onSearchQueryChange,
  onSortByChange,
  onTeamFilterChange,
  onFavoritesOnlyChange,
}: ProjectToolbarProps) => {
  const teamName =
    teamFilter === "all"
      ? null
      : teamFilter === "workspace"
        ? "Workspace"
        : (teamOptions.find((team) => team.id === teamFilter)?.name ?? null);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          Projects
        </h1>
        <span className="flex-1" />
        <CreateProjectModal onProjectCreated={onProjectCreated} />
      </div>

      <ModuleTabs
        className="mt-4"
        counts={{
          [paths.projects()]: tabCounts.all,
          [paths.projects({ status: "active" })]: tabCounts.active,
          [paths.projects({ status: "archived" })]: tabCounts.archived,
        }}
      />

      <div className="mt-3.5 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative h-8 w-full sm:w-60">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search projects"
            aria-label="Search"
            className="h-full w-full rounded-xl border border-hairline bg-surface pr-2.5 pl-8 text-[13px] outline-none placeholder:text-ink-3 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/22"
          />
        </div>

        <Select value={teamFilter} onValueChange={onTeamFilterChange}>
          <SelectTrigger
            aria-label="Team"
            className={cn(
              chip,
              teamName && "border-signal/40 bg-signal-subtle",
            )}
          >
            <span className="text-ink-3">Team</span>
            <SelectValue>
              {teamName ? (
                <span className="font-medium text-ink">{teamName}</span>
              ) : null}
            </SelectValue>
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

        <Select
          value={sortBy}
          onValueChange={(value) => onSortByChange(value as ProjectSort)}
        >
          <SelectTrigger aria-label="Sort" className={chip}>
            <ArrowDownUpIcon className="size-3.5" aria-hidden="true" />
            <span className="text-ink-3">Sort</span>
            <SelectValue>
              <span className="font-medium text-ink">
                {sortOptions.find((option) => option.value === sortBy)?.label}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-xl border border-hairline px-2.5 text-[13px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring",
            favoritesOnly && "border-signal/40 bg-signal-subtle",
          )}
        >
          <StarIcon className="size-3.5" aria-hidden="true" />
          Favorites only
        </button>

        <span className="font-mono text-xs text-ink-3">
          {count} {count === 1 ? "project" : "projects"}
        </span>

        <span className="flex-1" />
        {viewControl}
      </div>
    </div>
  );
};
