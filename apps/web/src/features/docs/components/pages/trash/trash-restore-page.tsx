"use client";

import { Can } from "~/src/components/permissions/permission-provider";
import { Button } from "@zentro/ui/shadcn/button";
import { FileTextIcon, InfoIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { ModuleTabs } from "~/src/components/shell/module-section-nav";
import { paths } from "~/src/lib/paths";

import {
  DocsListItem,
  formatDocDate,
  getDocOwner,
  getDocTitle,
} from "../../../lib/docs";
import { ProjectChip } from "../../doc-rows";

export function TrashRestorePage() {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function fetchDeletedDocs() {
    const docsList = await trpc.docs.getAll.query({ includeDeleted: true });
    setDocs(docsList.filter((doc) => doc.deletedAt));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDeletedDocs() {
      try {
        const docsList = await trpc.docs.getAll.query({ includeDeleted: true });

        if (isMounted) {
          setDocs(docsList.filter((doc) => doc.deletedAt));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDeletedDocs();

    return () => {
      isMounted = false;
    };
  }, [trpc]);

  async function restoreDoc(id: string) {
    try {
      setRestoringId(id);
      await trpc.docs.restore.mutate({ id });
      await fetchDeletedDocs();
      toastSuccess("Doc restored");
    } catch (error) {
      toastError(error, "Failed to restore doc");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="flex w-full flex-col">
      <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
        Trash
      </h1>
      <ModuleTabs
        className="mt-4"
        counts={{ [paths.trashedDocs()]: isLoading ? undefined : docs.length }}
      />
      <p className="mt-3.5 mb-3 flex items-start gap-2.5 rounded-md border border-hairline bg-surface px-4 py-3 text-[13px] text-ink-2">
        <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Docs moved to Trash stay here until someone restores them. Restoring a
        doc puts it back where it was, with its comments.
      </p>

      <div role="table" aria-label="Docs in trash" className="flex flex-col">
        <div
          role="row"
          className="hidden h-9 items-center gap-3 border-b border-hairline px-3 font-mono text-[11px] tracking-[0.08em] text-ink-3 sm:flex"
        >
          <span role="columnheader" className="flex-1">
            TITLE
          </span>
          <span role="columnheader" className="w-40">
            OWNER
          </span>
          <span role="columnheader" className="w-32">
            PROJECT
          </span>
          <span role="columnheader" className="w-20 text-right">
            DELETED
          </span>
          <span role="columnheader" className="w-28" />
        </div>

        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="my-1 h-11 rounded-md bg-hover motion-safe:animate-[zsh_2.4s_ease-in-out_infinite]"
              />
            ))
          : null}

        {!isLoading && !docs.length ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
            <p className="font-serif-italic text-[2.25rem] leading-none">
              Trash is empty.
            </p>
            <p className="text-sm text-ink-2">
              Docs you move to Trash show up here, ready to restore.
            </p>
          </div>
        ) : null}

        {docs.map((doc) => {
          const owner = getDocOwner(doc);

          return (
            <div
              role="row"
              key={doc.id}
              className="flex min-h-12 flex-wrap items-center gap-3 border-b border-hairline/70 px-3 py-1.5"
            >
              <span
                role="cell"
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                <FileTextIcon
                  className="size-4 shrink-0 text-ink-3"
                  aria-hidden="true"
                />
                <span className="truncate text-[15px]">
                  {getDocTitle(doc.title)}
                </span>
              </span>
              <span
                role="cell"
                className="hidden w-40 items-center gap-2 text-[13px] text-ink-2 sm:flex"
              >
                <ActorAvatar name={owner} size={22} />
                <span className="truncate">{owner}</span>
              </span>
              <span role="cell" className="hidden w-32 sm:block">
                <ProjectChip doc={doc} />
              </span>
              <span
                role="cell"
                className="w-20 text-right font-mono text-xs text-ink-3"
              >
                {formatDocDate(doc.deletedAt)}
              </span>
              <span role="cell" className="flex w-28 justify-end">
                <Can permission="docs.restore">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-hairline bg-transparent px-2.5 text-[13px]"
                    disabled={restoringId === doc.id}
                    onClick={() => restoreDoc(doc.id)}
                  >
                    <RotateCcwIcon className="size-3.5" />
                    {restoringId === doc.id ? "Restoring..." : "Restore"}
                  </Button>
                </Can>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
