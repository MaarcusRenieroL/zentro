"use client";

import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react";
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
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          onSubmit={handleSearch}
          className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl"
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

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All projects</SelectItem>
                <SelectItem value="workspace">Workspace docs</SelectItem>
                <SelectItem value="project">Project docs</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All owners</SelectItem>
                <SelectItem value="owned-by-you">Owned by me</SelectItem>
                <SelectItem value="shared">Shared with me</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select defaultValue="updated">
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="updated">Recently updated</SelectItem>
                <SelectItem value="created">Recently created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-full sm:w-auto">
            <ListFilterIcon className="size-4" />
            Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
