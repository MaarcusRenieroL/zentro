"use client";

import { paths } from "~/src/lib/paths";
import { FileTextIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { Kbd } from "@zentro/ui/components/kbd";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { ModuleTabs } from "~/src/components/shell/module-section-nav";

import {
  DocsListItem,
  formatDocDate,
  getDocOwner,
  getDocTitle,
} from "../../../lib/docs";
import { ProjectChip } from "../../doc-rows";

type SearchResultsPageProps = {
  query: string;
};

export function SearchResultsPage({ query }: SearchResultsPageProps) {
  const trpc = useTrpcClient();
  const [results, setResults] = useState<
    Array<DocsListItem & { snippet?: string | null }>
  >([]);
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
    <section className="flex w-full flex-col">
      <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
        Search docs
      </h1>
      <ModuleTabs className="mt-4" />

      <form
        action={paths.searchDocs()}
        role="search"
        className="mt-4 flex h-12 items-center gap-2.5 rounded-xl border border-hairline bg-surface px-3.5 focus-within:border-signal focus-within:ring-[3px] focus-within:ring-ring/22"
      >
        <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
        <input
          name="q"
          defaultValue={query}
          autoFocus={!query}
          aria-label="Search docs"
          placeholder="Search docs by title or text"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
        />
        <Kbd>↵</Kbd>
      </form>

      <p className="mt-3 mb-2 font-mono text-xs text-ink-3" role="status">
        {!normalizedQuery
          ? "Type a word from a title or from the text."
          : isLoading
            ? "Searching…"
            : `${results.length} ${results.length === 1 ? "result" : "results"}`}
      </p>

      {normalizedQuery && !isLoading && !results.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-serif-italic text-[2.25rem] leading-none text-balance">
            Nothing matches “{query.trim()}”.
          </p>
          <p className="max-w-[420px] text-sm text-ink-2">
            Search looks at titles and the text of every doc you can open. Try a
            shorter word, or look in Trash.
          </p>
        </div>
      ) : null}

      {results.length ? (
        <div role="table" aria-label="Results" className="flex flex-col">
          <div
            role="row"
            className="hidden h-9 items-center gap-3 border-b border-hairline px-3 font-mono text-[11px] tracking-[0.08em] text-ink-3 sm:flex"
          >
            <span role="columnheader" className="flex-1">
              TITLE
            </span>
            <span role="columnheader" className="w-24">
              PROJECT
            </span>
            <span role="columnheader" className="w-40">
              OWNER
            </span>
            <span role="columnheader" className="w-20 text-right">
              EDITED
            </span>
          </div>
          {results.map((doc) => {
            const owner = getDocOwner(doc);

            return (
              <div
                role="row"
                key={doc.id}
                className="relative flex min-h-14 items-center gap-3 border-b border-hairline/70 px-3 py-2 hover:bg-hover"
              >
                <span
                  role="cell"
                  className="flex min-w-0 flex-1 items-start gap-2.5"
                >
                  <FileTextIcon
                    className="mt-0.5 size-4 shrink-0 text-ink-3"
                    aria-hidden="true"
                  />
                  <span className="flex min-w-0 flex-col">
                    <Link
                      href={paths.doc(doc.slug)}
                      className="truncate text-[15px] outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
                    >
                      <Highlight text={getDocTitle(doc.title)} query={query} />
                    </Link>
                    {doc.snippet ? (
                      <span className="truncate text-[13px] text-ink-2">
                        <Highlight text={doc.snippet} query={query} />
                      </span>
                    ) : null}
                  </span>
                </span>
                <span role="cell" className="hidden w-24 sm:block">
                  <ProjectChip doc={doc} />
                </span>
                <span
                  role="cell"
                  className="hidden w-40 items-center gap-2 text-[13px] text-ink-2 sm:flex"
                >
                  <ActorAvatar name={owner} size={22} />
                  <span className="truncate">{owner}</span>
                </span>
                <span
                  role="cell"
                  className="w-20 text-right font-mono text-xs text-ink-3"
                >
                  {formatDocDate(doc.updatedAt)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/** The words that matched, marked. */
function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();

  if (!needle) return <>{text}</>;

  const parts = text.split(
    new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"),
  );

  return (
    <>
      {parts.map((part, index) =>
        index % 2 ? (
          <mark key={index} className="rounded-[3px] bg-selected text-ink">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
