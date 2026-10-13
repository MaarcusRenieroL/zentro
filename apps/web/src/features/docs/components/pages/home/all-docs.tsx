"use client";

import { paths } from "~/src/lib/paths";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zentro/ui/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zentro/ui/shadcn/tabs";
import {
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  Grid2X2Icon,
  ListIcon,
} from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

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
import { CreateDocModal } from "./create-doc-modal";

export const AllDocs: FC = () => {
  const trpc = useTrpcClient();
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDocs() {
      try {
        const docsList = await trpc.docs.getAll.query({});

        if (isMounted) {
          setDocs(docsList);
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
    <div className="flex w-full flex-col gap-5">
      <Tabs defaultValue="table" className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">All docs</h2>
            <p className="text-sm text-muted-foreground">
              Browse every page in your workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline">{docs.length} docs</Badge>
            <TabsList>
              <TabsTrigger value="table" aria-label="Table view">
                <ListIcon className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <Grid2X2Icon className="size-4" />
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="table" className="mt-0">
          <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : docs.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doc</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => {
                    const owner = getDocOwner(doc);

                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex min-w-64 items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                              <FileTextIcon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                <Link href={paths.doc(doc.slug)}>
                                  {getDocTitle(doc.title)}
                                </Link>
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                Updated {formatDocDate(doc.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDocProject(doc)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getDocTeam(doc)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback>
                                {getInitials(owner)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{owner}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDocDate(doc.updatedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <FileTextIcon className="mb-3 size-10 text-muted-foreground" />
                <p className="text-sm font-medium">No docs yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first doc to start building your workspace
                  knowledge base.
                </p>
                <div className="mt-4">
                  <CreateDocModal />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grid" className="mt-0">
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

            {!isLoading && !docs.length ? (
              <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center md:col-span-2 xl:col-span-3">
                <FileTextIcon className="mx-auto mb-3 size-9 text-muted-foreground" />
                <p className="text-sm font-medium">No docs yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New docs will appear here after you create them.
                </p>
              </div>
            ) : null}

            {docs.map((doc) => (
              <Card
                key={doc.id}
                className="rounded-lg transition-colors hover:bg-muted/20"
                size="sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
                      <BookOpenIcon className="size-4" />
                    </div>
                    <Badge variant="secondary">Doc</Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    <Link href={paths.doc(doc.slug)}>
                      {getDocTitle(doc.title)}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    Updated {formatDocDate(doc.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{getDocProject(doc)}</Badge>
                  <Badge variant="secondary">{getDocTeam(doc)}</Badge>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {formatDocDate(doc.updatedAt)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
