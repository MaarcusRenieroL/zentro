"use client";

import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  ClockIcon,
  FolderIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import type { FormEvent } from "react";

export const SearchToolbar: FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();
    const searchPath = normalizedQuery
      ? `/search?q=${encodeURIComponent(normalizedQuery)}`
      : "/search";

    router.push(searchPath);
  }

  function handleClearSearch() {
    setQuery("");
  }

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <form
          onSubmit={handleSearch}
          className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-2xl"
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-9 pl-9"
              placeholder="Search docs..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <SearchIcon className="size-4" />
            Search
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/recent">
              <ClockIcon className="size-4" />
              Recent
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/projects">
              <FolderIcon className="size-4" />
              Projects
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/trash">
              <Trash2Icon className="size-4" />
              Trash
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
