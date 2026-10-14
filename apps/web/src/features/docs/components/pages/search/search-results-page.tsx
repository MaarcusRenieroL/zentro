"use client";

import { paths } from "~/src/lib/paths";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { FileSearchIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";

import {
  DocsListItem,
  formatDocDate,
  getDocOwner,
  getDocProject,
  getDocTeam,
  getDocTitle,
  getInitials,
} from "../../../lib/docs";

type SearchResultsPageProps = {
  query: string;
};

export function SearchResultsPage({ query }: SearchResultsPageProps) {
  const trpc = useTrpcClient();
  const [results, setResults] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    let isMounted = true;

    async function fetchDocs() {
      if (!normalizedQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const docsList = await trpc.docs.search.query({
          query,
        });

        if (isMounted) {
          setResults(docsList);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDocs();

    return () => {
      isMounted = false;
    };
  }, [normalizedQuery, query, trpc]);

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
          <SearchIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Search docs</h1>
          <p className="text-sm text-muted-foreground">
            Find pages by title, content, project, team, or owner.
          </p>
        </div>
      </div>

      <form
        action={paths.searchDocs()}
        className="flex flex-col gap-3 rounded-lg border bg-background p-3 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            className="pl-9"
            defaultValue={query}
            placeholder="Search docs..."
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          <SearchIcon className="size-4" />
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              {normalizedQuery
                ? `${results.length} result${results.length === 1 ? "" : "s"}`
                : "Start a search"}
            </p>
            <p className="text-xs text-muted-foreground">
              {normalizedQuery
                ? `Showing matches for "${query.trim()}"`
                : "Use the search box to find docs across the workspace."}
            </p>
          </div>
          {normalizedQuery ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={paths.searchDocs()}>Clear</Link>
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div>
            {results.map((doc) => {
              const owner = getDocOwner(doc);

              return (
                <Link
                  key={doc.id}
                  href={paths.doc(doc.slug)}
                  className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
                      <FileSearchIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{getDocTitle(doc.title)}</p>
                        <Badge variant="secondary">Doc</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        Updated {formatDocDate(doc.updatedAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{getDocProject(doc)}</Badge>
                        <Badge variant="secondary">{getDocTeam(doc)}</Badge>
                        <span>Created by {owner}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="size-7">
                      <AvatarFallback>{getInitials(owner)}</AvatarFallback>
                    </Avatar>
                    {owner}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <FileSearchIcon className="mb-3 size-9 text-muted-foreground" />
            <p className="text-sm font-medium">
              {normalizedQuery ? "No docs found" : "Search your docs"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {normalizedQuery
                ? "Try searching by doc title, project, team, status, or owner."
                : "Enter a keyword above to see matching workspace docs."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
