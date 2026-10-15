"use client";

import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { ModuleTabs } from "~/src/components/shell/module-section-nav";

import type { DocsListItem } from "../../../lib/docs";
import { DocTable } from "../../doc-rows";
import { CreateDocModal } from "../home/create-doc-modal";

type StaticDocListPageProps = {
  title: string;
  description: string;
  mode: "my-docs" | "recent";
};

export function StaticDocListPage({
  title,
  description,
  mode,
}: StaticDocListPageProps) {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDocs() {
      try {
        const docsList = await trpc.docs.getAll.query({});

        if (isMounted) {
          setDocs(docsList.slice(0, mode === "my-docs" ? 3 : 12));
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
  }, [mode, trpc]);

  return (
    <section className="flex w-full flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          {title}
        </h1>
        <span className="flex-1" />
        <CreateDocModal />
      </div>
      <ModuleTabs className="mt-4" />
      <p className="mt-3.5 mb-3 text-sm text-ink-2">{description}</p>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-12" />
          ))}
        </div>
      ) : docs.length ? (
        <DocTable docs={docs} />
      ) : (
        <EmptyState
          title="No docs found."
          description="Create a doc and it will appear here."
          action={<CreateDocModal triggerVariant="outline" />}
        />
      )}
    </section>
  );
}
