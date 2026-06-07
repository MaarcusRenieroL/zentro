"use client";

import { Avatar, AvatarFallback } from "@zentro/ui/components/shadcn/avatar";
import { Button } from "@zentro/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Badge } from "@zentro/ui/shadcn/badge";
import { FileTextIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";

import {
  DocsListItem,
  formatDocDate,
  getDocOwner,
  getDocProject,
  getDocTitle,
  getInitials,
} from "../../../lib/docs";

export const RecentDocs: FC = () => {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDocs() {
      try {
        const docsList = await trpc.docs.getAll.query({});

        if (isMounted) {
          setDocs(docsList.slice(0, 4));
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
  }, [trpc]);

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent docs</h2>
          <p className="text-sm text-muted-foreground">
            Pages your team touched most recently
          </p>
        </div>
        <Link href="/docs">
          <Button variant="link" size="sm">
            View all
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="min-h-48 rounded-lg" size="sm">
                <CardHeader>
                  <div className="h-20 animate-pulse rounded-md bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))
          : null}

        {docs.map((doc) => (
          <Card key={doc.id} className="min-h-48 rounded-lg" size="sm">
            <CardHeader className="gap-3">
              <div className="flex items-start gap-3">
                <Link
                  href={`/docs/${doc.slug}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <FileTextIcon className="size-4" />
                </Link>

                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-sm font-semibold">
                    <Link href={`/docs/${doc.slug}`}>
                      {getDocTitle(doc.title)}
                    </Link>
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2 text-sm leading-5">
                    Updated {formatDocDate(doc.updatedAt)}
                  </CardDescription>
                </div>

                <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1">
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">Open doc actions</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              <Badge variant="outline">{getDocProject(doc)}</Badge>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(getDocOwner(doc))}
                  </AvatarFallback>
                </Avatar>

                <p className="truncate">{getDocOwner(doc)}</p>
              </div>
            </CardFooter>
          </Card>
        ))}

        {!isLoading && !docs.length ? (
          <div className="rounded-lg border px-4 py-10 text-center md:col-span-2 xl:col-span-4">
            <p className="text-sm font-medium">No recent docs</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New and edited docs will show up here.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
