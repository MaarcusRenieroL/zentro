"use client";

import Link from "next/link";
import { FolderKanbanIcon, StarIcon } from "lucide-react";

import { EmptyState } from "@zentro/ui/components/empty-state";
import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { paths } from "~/src/lib/paths";

export type ProjectListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
  status: string;
  taskKeyPrefix?: string | null;
  totalTasks?: number | null;
  doneTasks?: number | null;
  updatedAt: Date;
};

type ProjectListProps = {
  isLoading: boolean;
  projects: ProjectListItem[];
  view: "grid" | "list";
  hasFilters: boolean;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  /** Heading of the non-favorite group, such as "All active projects". */
  groupLabel: string;
};

const tints = [
  "bg-tint-tasks",
  "bg-tint-projects",
  "bg-tint-docs",
  "bg-tint-teams",
  "bg-tint-audit",
] as const;

function tintFor(seed: string) {
  let hash = 0;

  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return tints[hash % tints.length];
}

function formatUpdated(updatedAt: Date) {
  const days = Math.floor((Date.now() - updatedAt.getTime()) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";

  return updatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusPill({ status }: { status: string }) {
  const archived = status === "archived";

  return (
    <span className="flex h-[22px] items-center gap-1.5 rounded-full border border-hairline bg-tint-chip px-2 text-xs">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          archived ? "border border-ink-3" : "bg-status-done",
        )}
      />
      {archived ? "Archived" : "Active"}
    </span>
  );
}

function Star({
  project,
  active,
  onToggle,
}: {
  project: ProjectListItem;
  active: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${project.name} from favorites`
          : `Add ${project.name} to favorites`
      }
      onClick={() => onToggle(project.id)}
      className="relative z-[1] flex size-7 items-center justify-center rounded-md text-ink-2 outline-none hover:bg-tint-chip focus-visible:ring-2 focus-visible:ring-ring"
    >
      <StarIcon
        className={cn("size-4", active && "fill-ink text-ink")}
        aria-hidden="true"
      />
    </button>
  );
}

function Tile({
  project,
  favorite,
  onToggleFavorite,
}: {
  project: ProjectListItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const total = project.totalTasks ?? 0;
  const done = project.doneTasks ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <article className="tile group relative flex flex-col overflow-hidden transition-colors hover:border-ink-3">
      <header
        className={cn(
          "flex h-[52px] items-center gap-2.5 px-4",
          tintFor(project.id),
        )}
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-tint-chip font-mono text-[11px]">
          {project.name.charAt(0).toUpperCase()}
        </span>
        <StatusPill status={project.status} />
        <span className="flex-1" />
        <Star project={project} active={favorite} onToggle={onToggleFavorite} />
      </header>
      <div className="flex flex-1 flex-col gap-3 px-[18px] pt-3.5 pb-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="flex items-baseline gap-2 text-[17px] font-semibold">
            <Link
              href={paths.project(project.slug)}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {project.name}
            </Link>
            <span className="font-mono text-xs font-normal text-ink-3">
              {project.taskKeyPrefix ?? project.slug}
            </span>
          </h3>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-ink-2">
            {project.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            role="progressbar"
            aria-label={`${done} of ${total} tasks done`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1 flex-1 overflow-hidden rounded-full bg-sunken"
          >
            <span
              className="block h-full bg-status-done"
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="font-mono text-xs text-ink-2">
            {done}/{total}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 text-[13px] text-ink-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-[3px] border border-hairline bg-tint-teams"
          />
          {project.teamName ?? "Workspace level"}
          <span className="flex-1" />
          <span className="font-mono text-xs text-ink-3">
            {formatUpdated(project.updatedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

function Row({
  project,
  favorite,
  onToggleFavorite,
}: {
  project: ProjectListItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const total = project.totalTasks ?? 0;
  const done = project.doneTasks ?? 0;

  return (
    <li className="relative flex min-h-16 items-center gap-3 rounded-xl border-t border-hairline/60 px-3 py-2 first:border-t-0 hover:bg-hover">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-ink",
          tintFor(project.id),
        )}
      >
        <FolderKanbanIcon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={paths.project(project.slug)}
          className="block truncate text-[15px] font-medium outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {project.name}
        </Link>
        <p className="truncate font-mono text-xs text-ink-3">
          {project.taskKeyPrefix ?? project.slug}
          <span className="hidden sm:inline">
            {" · "}
            {project.description || "No description provided."}
          </span>
        </p>
      </div>
      <span className="hidden w-24 shrink-0 font-mono text-xs text-ink-2 md:block">
        {done}/{total} done
      </span>
      <StatusPill status={project.status} />
      <span className="hidden w-32 truncate text-xs text-ink-2 lg:block">
        {project.teamName ?? "Workspace level"}
      </span>
      <span className="hidden w-20 text-right font-mono text-xs text-ink-3 sm:block">
        {formatUpdated(project.updatedAt)}
      </span>
      <Star project={project} active={favorite} onToggle={onToggleFavorite} />
    </li>
  );
}

export const ProjectList = ({
  isLoading,
  projects,
  view,
  hasFilters,
  favoriteIds,
  onToggleFavorite,
  groupLabel,
}: ProjectListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="tile overflow-hidden">
            <Skeleton className="h-[52px] rounded-none" />
            <div className="flex flex-col gap-3 p-[18px]">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-1 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanbanIcon className="size-4" aria-hidden="true" />}
        title={hasFilters ? "No matching projects" : "No projects yet"}
        description={
          hasFilters
            ? "Try a different project name, slug, team, or description."
            : "Create a project to start organizing and tracking work across your team."
        }
      />
    );
  }

  const favorites = projects.filter((project) =>
    favoriteIds.includes(project.id),
  );
  const rest = projects.filter((project) => !favoriteIds.includes(project.id));
  const render = (items: ProjectListItem[]) =>
    view === "list" ? (
      <ul aria-label="Projects" className="flex flex-col">
        {items.map((project) => (
          <Row
            key={project.id}
            project={project}
            favorite={favoriteIds.includes(project.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ul>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((project) => (
          <Tile
            key={project.id}
            project={project}
            favorite={favoriteIds.includes(project.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-7">
      {favorites.length > 0 ? (
        <section aria-label="Favorites" className="flex flex-col gap-3">
          <h2 className="eyebrow">Favorites</h2>
          {render(favorites)}
        </section>
      ) : null}
      {rest.length > 0 ? (
        <section aria-label={groupLabel} className="flex flex-col gap-3">
          {favorites.length > 0 ? (
            <h2 className="eyebrow">{groupLabel}</h2>
          ) : null}
          {render(rest)}
        </section>
      ) : null}
    </div>
  );
};
