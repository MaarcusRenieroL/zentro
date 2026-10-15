"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { Grid2X2Icon, ListIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { EmptyState } from "@zentro/ui/components/empty-state";
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
import { Header } from "./header";
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
    const copy = [...docs];

    copy.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "project"
          ? (a.projectName ?? "~").localeCompare(b.projectName ?? "~")
          : b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    return copy;
  }, [docs, sort]);

  return (
    <section className="flex w-full flex-col gap-7">
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
        <EmptyState
          title="No docs yet."
          description="Create your first doc to start building your workspace knowledge base."
          action={<CreateDocModal triggerVariant="outline" />}
        />
      ) : (
        <>
          <section aria-label="Recent" className="flex flex-col gap-3">
            <h2 className="eyebrow">Recent</h2>
            <DocTiles docs={recent} />
          </section>

          <section aria-label="All docs" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[15px] font-semibold">All docs</h2>
              <span className="font-mono text-xs text-ink-3">
                {docs.length}
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
              <DocTiles docs={sorted} columns="sm:grid-cols-2 xl:grid-cols-3" />
            )}
          </section>
        </>
      )}
    </section>
  );
};
