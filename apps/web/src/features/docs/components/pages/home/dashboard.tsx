"use client";

import { FC, useEffect, useMemo, useState } from "react";
import {
  Grid2X2Icon,
  ListIcon,
  FolderKanbanIcon,
  SparklesIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { ErrorState } from "@zentro/ui/components/error-state";
import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { ModuleNavClaim } from "~/src/components/shell/module-section-nav";

import type { DocsListItem } from "../../../lib/docs";
import { DocTable, DocTiles, DocGrouped } from "../../doc-rows";
import { CreateDocModal } from "./create-doc-modal";
import { Header } from "./header";
import { TemplateRow } from "./templates";
import { SearchToolbar } from "./search-toolbar";

type Sort = "edited" | "title" | "project";
type ViewMode = "table" | "grid" | "grouped";

export const HomeDashboard: FC = () => {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<Sort>("edited");
  const [view, setView] = useState<ViewMode>("grid");
  const [attempt, setAttempt] = useState(0);
  const [project, setProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    let live = true;

    setIsLoading(true);
    trpc.docs.getAll
      .query({})
      .then((list) => {
        if (live) {
          setDocs(list);
          setFailed(false);
        }
      })
      .catch(() => live && setFailed(true))
      .finally(() => live && setIsLoading(false));

    return () => {
      live = false;
    };
  }, [trpc, attempt]);

  // Unique projects list with doc counts
  const projectsList = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of docs) {
      if (d.projectName) {
        map.set(d.projectName, (map.get(d.projectName) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [docs]);

  // Recent docs (updated in last 7 days)
  const recentDocs = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return docs.filter((d) => d.updatedAt.getTime() > oneWeekAgo);
  }, [docs]);

  // Top 4 most recently edited for the Recent Strip
  const recentStrip = useMemo(
    () =>
      [...docs]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 4),
    [docs],
  );

  // Filter category counts
  const filterCounts = useMemo(() => {
    const specs = docs.filter((d) => {
      const t = d.title.toLowerCase();
      return (
        t.includes("spec") ||
        t.includes("prd") ||
        t.includes("rfc") ||
        t.includes("design")
      );
    }).length;

    const meetings = docs.filter((d) => {
      const t = d.title.toLowerCase();
      return (
        t.includes("meeting") ||
        t.includes("sync") ||
        t.includes("notes") ||
        t.includes("retro")
      );
    }).length;

    return {
      all: docs.length,
      specs,
      meetings,
      recent: recentDocs.length,
    };
  }, [docs, recentDocs]);

  // Filtered and sorted docs
  const filteredAndSortedDocs = useMemo(() => {
    let list = [...docs];

    // Project filter
    if (project !== null) {
      list = list.filter((doc) => (doc.projectName ?? "") === project);
    }

    // Category filter
    if (categoryFilter === "specs") {
      list = list.filter((d) => {
        const t = d.title.toLowerCase();
        return (
          t.includes("spec") ||
          t.includes("prd") ||
          t.includes("rfc") ||
          t.includes("design")
        );
      });
    } else if (categoryFilter === "meetings") {
      list = list.filter((d) => {
        const t = d.title.toLowerCase();
        return (
          t.includes("meeting") ||
          t.includes("sync") ||
          t.includes("notes") ||
          t.includes("retro")
        );
      });
    } else if (categoryFilter === "recent") {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((d) => d.updatedAt.getTime() > oneWeekAgo);
    }

    // Live search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          (doc.excerpt && doc.excerpt.toLowerCase().includes(q)) ||
          (doc.projectName && doc.projectName.toLowerCase().includes(q)) ||
          (doc.createdBy && doc.createdBy.toLowerCase().includes(q)),
      );
    }

    // Sorting
    list.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "project"
          ? (a.projectName ?? "~").localeCompare(b.projectName ?? "~")
          : b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    return list;
  }, [docs, project, categoryFilter, searchQuery, sort]);

  return (
    <div className="w-full flex min-w-0 flex-col gap-10 sm:gap-12">
      <ModuleNavClaim />
      <Header
        totalDocs={docs.length}
        projectCount={projectsList.length}
        recentCount={recentDocs.length}
      />

      <SearchToolbar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        activeFilter={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterCounts={filterCounts}
        projects={projectsList}
        selectedProject={project}
        onProjectChange={setProject}
      />

      {failed ? (
        <ErrorState
          title="Docs could not be loaded"
          message="We could not read your docs. They are safe; try again."
          onRetry={() => setAttempt((value) => value + 1)}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-6" aria-busy="true">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((tile) => (
              <Skeleton key={tile} className="h-[160px] rounded-2xl" />
            ))}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-12 rounded-2xl" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <>
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-hairline/80 bg-surface/50 px-8 py-20 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-tint-docs text-ink shadow-sm">
              <SparklesIcon className="size-7" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Your Knowledge Base is Empty
            </h2>
            <p className="max-w-[500px] text-sm text-ink-3 leading-relaxed">
              Specs, meeting notes, and architectural decisions live here, next
              to the tasks they explain. Start blank or pick a blueprint below.
            </p>
            <div className="pt-2">
              <CreateDocModal />
            </div>
          </div>
          <TemplateRow />
        </>
      ) : (
        <>
          {/* Quick Start Blueprints */}
          <TemplateRow />

          {/* Recent Strip (only shown when not searching and on All filter) */}
          {!searchQuery &&
            categoryFilter === "all" &&
            project === null &&
            recentStrip.length > 0 && (
              <section aria-label="Recent docs" className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                    Recently Edited
                  </h2>
                </div>
                <DocTiles
                  docs={recentStrip}
                  columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                />
              </section>
            )}

          {/* Document Collection View */}
          <section aria-label="All docs" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/80 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">
                  {project === null
                    ? categoryFilter === "specs"
                      ? "Product Specs & RFCs"
                      : categoryFilter === "meetings"
                        ? "Meeting Notes"
                        : categoryFilter === "recent"
                          ? "Recently Updated Docs"
                          : "All Documents"
                    : project || "No Project"}
                </h2>
                <span className="font-mono text-xs text-ink-3">
                  ({filteredAndSortedDocs.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Select */}
                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as Sort)}
                >
                  <SelectTrigger
                    aria-label="Sort docs"
                    className="h-8 gap-1.5 rounded-lg border-hairline bg-surface/80 px-2.5 text-xs shadow-none data-[size=default]:h-8"
                  >
                    <span className="text-ink-3">Sort:</span>
                    <SelectValue>
                      <span className="font-medium text-ink">
                        {sort === "title"
                          ? "Title (A-Z)"
                          : sort === "project"
                            ? "Project"
                            : "Last edited"}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edited">Last edited</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle: Grid / Table / Grouped */}
                <div
                  role="radiogroup"
                  aria-label="View mode"
                  className="flex gap-0.5 rounded-lg border border-hairline bg-surface p-0.5"
                >
                  {(
                    [
                      ["grid", Grid2X2Icon, "Grid"],
                      ["table", ListIcon, "Table"],
                      ["grouped", FolderKanbanIcon, "Grouped"],
                    ] as const
                  ).map(([value, Icon, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={view === value}
                      aria-label={`${label} view`}
                      onClick={() => setView(value)}
                      className={cn(
                        "flex h-[26px] items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors outline-none",
                        view === value
                          ? "bg-ink text-ink-inverse font-medium"
                          : "text-ink-3 hover:text-ink hover:bg-hover",
                      )}
                      title={`${label} view`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Render Selected View */}
            {filteredAndSortedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline py-12 text-center">
                <p className="text-sm font-medium text-ink">
                  No documents match your search or filter
                </p>
                <p className="mt-1 text-xs text-ink-3">
                  Try clearing the search query or switching categories.
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  className="mt-3 text-xs"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setProject(null);
                  }}
                >
                  Reset all filters
                </Button>
              </div>
            ) : view === "table" ? (
              <DocTable docs={filteredAndSortedDocs} />
            ) : view === "grouped" ? (
              <DocGrouped docs={filteredAndSortedDocs} />
            ) : (
              <DocTiles
                docs={filteredAndSortedDocs}
                columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              />
            )}
          </section>
        </>
      )}
    </div>
  );
};
