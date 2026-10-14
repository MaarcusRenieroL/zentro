"use client";

import { paths } from "~/src/lib/paths";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { ClockIcon, FileTextIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";

import {
  DocsListItem,
  formatDocDate,
  getDocProject,
  getDocTeam,
  getDocTitle,
} from "../../../lib/docs";
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
  const Icon = mode === "my-docs" ? StarIcon : ClockIcon;
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
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
            <Icon className="size-4" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="rounded-lg" size="sm">
                <CardHeader>
                  <div className="h-24 animate-pulse rounded-md bg-muted" />
                </CardHeader>
              </Card>
            ))
          : null}

        {docs.map((doc) => (
          <Card
            key={doc.id}
            className="rounded-lg transition-colors hover:bg-muted/20"
            size="sm"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
                  <FileTextIcon className="size-4" />
                </div>
                <Badge variant="secondary">Doc</Badge>
              </div>
              <CardTitle className="text-sm font-semibold">
                <Link href={paths.doc(doc.slug)}>{getDocTitle(doc.title)}</Link>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                Updated {formatDocDate(doc.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{getDocProject(doc)}</Badge>
                <Badge variant="secondary">{getDocTeam(doc)}</Badge>
              </div>
              <Button variant="link" size="sm" asChild>
                <Link href={paths.doc(doc.slug)}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {!isLoading && !docs.length ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center md:col-span-2 xl:col-span-3">
            <FileTextIcon className="mx-auto mb-3 size-9 text-muted-foreground" />
            <p className="text-sm font-medium">No docs found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a doc and it will appear here.
            </p>
            <div className="mt-4">
              <CreateDocModal />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
