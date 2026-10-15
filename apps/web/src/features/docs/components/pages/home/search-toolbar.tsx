"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, useEffect, useRef, useState, type FormEvent } from "react";
import { ClockIcon, FolderIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { Kbd } from "@zentro/ui/components/kbd";
import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

export const SearchToolbar: FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={handleSearch} className="min-w-0 flex-1 basis-72">
        <div className="relative h-11">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3"
          />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search docs by title or text"
            aria-label="Search docs"
            className="h-full w-full rounded-xl border border-border-strong bg-surface pr-10 pl-10 text-[15px] outline-none placeholder:text-ink-3 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/22"
          />
          <Kbd className="absolute top-1/2 right-3 -translate-y-1/2">/</Kbd>
        </div>
      </form>
      <Button variant="outline" asChild>
        <Link href={paths.recentDocs()}>
          <ClockIcon />
          Recent
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={paths.projectDocs()}>
          <FolderIcon />
          Projects
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={paths.trashedDocs()}>
          <Trash2Icon />
          Trash
        </Link>
      </Button>
    </div>
  );
};
