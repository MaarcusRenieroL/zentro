"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, useEffect, useRef, type FormEvent } from "react";
import {
  ClockIcon,
  FolderIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
  FileTextIcon,
  LayersIcon,
} from "lucide-react";

import { Kbd } from "@zentro/ui/components/kbd";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

interface SearchToolbarProps {
  query?: string;
  onQueryChange?: (value: string) => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  filterCounts?: {
    all: number;
    specs: number;
    meetings: number;
    recent: number;
  };
}

export const SearchToolbar: FC<SearchToolbarProps> = ({
  query = "",
  onQueryChange,
  activeFilter = "all",
  onFilterChange,
  filterCounts = { all: 0, specs: 0, meetings: 0, recent: 0 },
}) => {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  // "/" jumps to search, like the hint says.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        target?.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      event.preventDefault();
      input.current?.focus();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    router.push(value ? paths.searchDocs(value) : paths.searchDocs());
  }

  const filters = [
    { id: "all", label: "All Docs", count: filterCounts.all },
    { id: "specs", label: "Specs & RFCs", count: filterCounts.specs },
    { id: "meetings", label: "Meetings", count: filterCounts.meetings },
    { id: "recent", label: "Recent", count: filterCounts.recent },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="min-w-0 flex-1 basis-72">
          <div className="relative h-10">
            <SearchIcon
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
            />
            <input
              ref={input}
              value={query}
              onChange={(event) => onQueryChange?.(event.target.value)}
              placeholder="Search docs in real-time or press Enter for global search..."
              aria-label="Search docs"
              className="h-full w-full rounded-xl border border-hairline bg-surface/80 pr-16 pl-9 text-[13px] outline-none placeholder:text-ink-3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange?.("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-ink-3 hover:text-ink rounded"
                title="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            ) : (
              <Kbd className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px]">
                /
              </Kbd>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-hairline text-xs gap-1.5"
            asChild
          >
            <Link href={paths.recentDocs()}>
              <ClockIcon className="size-3.5" />
              Recent
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-hairline text-xs gap-1.5"
            asChild
          >
            <Link href={paths.projectDocs()}>
              <FolderIcon className="size-3.5" />
              Projects
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-hairline text-xs gap-1.5"
            asChild
          >
            <Link href={paths.trashedDocs()}>
              <Trash2Icon className="size-3.5" />
              Trash
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Category Chips */}
      {onFilterChange && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                activeFilter === f.id
                  ? "bg-ink text-ink-inverse"
                  : "bg-surface border border-hairline text-ink-2 hover:bg-hover hover:text-ink",
              )}
            >
              <span>{f.label}</span>
              {typeof f.count === "number" && (
                <span
                  className={cn(
                    "font-mono text-[10px] px-1 rounded",
                    activeFilter === f.id
                      ? "bg-ink-inverse/20 text-ink-inverse"
                      : "bg-muted text-ink-3",
                  )}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
