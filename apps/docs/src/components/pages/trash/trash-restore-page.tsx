"use client";

import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zentro/ui/shadcn/table";
import { ArchiveRestoreIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import {
  DocsListItem,
  formatDocDate,
  getDocOwner,
  getDocProject,
  getDocTitle,
  getInitials,
} from "../../../lib/docs";

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
    <section className="mx-auto flex w-full max-w-400 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
          <Trash2Icon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
          <p className="text-sm text-muted-foreground">
            Restore pages that were moved out of the workspace.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc</TableHead>
              <TableHead>Deleted by</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="space-y-3 py-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-10 animate-pulse rounded-md bg-muted"
                      />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading && !docs.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-36 text-center">
                  <Trash2Icon className="mx-auto mb-3 size-9 text-muted-foreground" />
                  <p className="text-sm font-medium">Trash is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Deleted docs will appear here.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}

            {docs.map((doc) => {
              const owner = getDocOwner(doc);

              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex min-w-64 items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                        <Trash2Icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">{getDocTitle(doc.title)}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDocDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback>{getInitials(owner)}</AvatarFallback>
                      </Avatar>
                      {owner}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDocProject(doc)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDocDate(doc.deletedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoringId === doc.id}
                        onClick={() => restoreDoc(doc.id)}
                      >
                        <ArchiveRestoreIcon className="size-4" />
                        {restoringId === doc.id ? "Restoring..." : "Restore"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
