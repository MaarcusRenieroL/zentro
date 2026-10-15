"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { Grid2X2Icon, ListIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { ErrorState } from "@zentro/ui/components/error-state";
import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { ModuleNavClaim } from "~/src/components/shell/module-section-nav";

import type { DocsListItem } from "../../../lib/docs";
import { DocTable, DocTiles } from "../../doc-rows";
import { CreateDocModal } from "./create-doc-modal";
import { DocsRail } from "./docs-rail";
import { Header } from "./header";
import { TemplateRow } from "./templates";
import { SearchToolbar } from "./search-toolbar";

type Sort = "edited" | "title" | "project";

export const HomeDashboard: FC = () => {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<Sort>("edited");
  const [view, setView] = useState<"table" | "grid">("table");
  const [attempt, setAttempt] = useState(0);
  const [project, setProject] = useState<string | null>(null);

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

  const recent = useMemo(
    () =>
      [...docs]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 4),
    [docs],
  );
  const sorted = useMemo(() => {
    const copy =
      project === null
        ? [...docs]
        : docs.filter((doc) => (doc.projectName ?? "") === project);

    copy.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "project"
          ? (a.projectName ?? "~").localeCompare(b.projectName ?? "~")
          : b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    return copy;
  }, [docs, sort, project]);

  const rail = !failed && !isLoading && docs.length > 0;

  return (
    <div
      className={cn(
        "grid w-full items-start gap-10",
        rail && "xl:grid-cols-[200px_minmax(0,1fr)]",
      )}
    >
      {rail ? (
        <aside className="hidden pt-3 xl:block">
          <DocsRail docs={docs} project={project} onProject={setProject} />
        </aside>
      ) : null}
      <section className="flex w-full min-w-0 flex-col gap-7">
        <ModuleNavClaim />
        <Header />
        <SearchToolbar />

        {failed ? (
          <ErrorState
            title="Docs could not be loaded"
            message="We could not read your docs. They are safe; try again."
            onRetry={() => setAttempt((value) => value + 1)}
          />
        ) : isLoading ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-3 w-16" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((tile) => (
                <Skeleton key={tile} className="h-[124px] rounded-xl" />
              ))}
            </div>
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-12" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
              <p className="font-serif-italic text-[2.5rem] leading-none">
                No docs yet.
              </p>
              <p className="max-w-[460px] text-[15px] text-ink-2">
                Specs, meeting notes and decisions live here, next to the tasks
                they explain. Start blank or from a template.
              </p>
              <CreateDocModal triggerVariant="outline" />
            </div>
            <TemplateRow />
          </>
        ) : (
          <>
            <section aria-label="Recent" className="flex flex-col gap-3">
              <h2 className="eyebrow">Recent</h2>
              <DocTiles docs={recent} />
            </section>

            <TemplateRow />

            <section aria-label="All docs" className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[15px] font-semibold">
                  {project === null ? "All docs" : project || "No project"}
                </h2>
                <span className="font-mono text-xs text-ink-3">
                  {sorted.length}
                </span>
                <span className="flex-1" />
                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as Sort)}
                >
                  <SelectTrigger
                    aria-label="Sort docs"
                    className="h-8 gap-1.5 rounded-xl border-hairline bg-transparent px-2.5 text-[13px] shadow-none data-[size=default]:h-8"
                  >
                    <span className="text-ink-3">Sort</span>
                    <SelectValue>
                      <span className="font-medium text-ink">
                        {sort === "title"
                          ? "Title"
                          : sort === "project"
                            ? "Project"
                            : "Last edited"}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edited">Last edited</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
                <div
                  role="radiogroup"
                  aria-label="View"
                  className="flex gap-0.5 rounded-xl border border-hairline bg-surface p-[3px]"
                >
                  {(
                    [
                      ["table", ListIcon, "Table"],
                      ["grid", Grid2X2Icon, "Grid"],
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
              </div>
              {view === "table" ? (
                <DocTable docs={sorted} />
              ) : (
                <DocTiles
                  docs={sorted}
                  columns="sm:grid-cols-2 xl:grid-cols-3"
                />
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
};
