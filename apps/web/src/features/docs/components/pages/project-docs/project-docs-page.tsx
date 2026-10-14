"use client";

import { paths } from "~/src/lib/paths";
import { Badge } from "@zentro/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { FileTextIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";

import {
  DocsListItem,
  formatDocDate,
  getDocTeam,
  getDocTitle,
} from "../../../lib/docs";
import { CreateDocModal } from "../home/create-doc-modal";

type ProjectItem = {
  id: string;
  name: string;
  teamName: string | null;
};

export function ProjectDocsPage() {
  const trpc = useTrpcClient();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [docs, setDocs] = useState<DocsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchProjectDocs() {
      try {
        const [projectList, docsList] = await Promise.all([
          // The Projects module may be turned off; docs then fall back to the
          // workspace group.
          trpc.project.getProjectsByOrgId.query().catch(() => []),
          trpc.docs.getAll.query({}),
        ]);

        if (isMounted) {
          setProjects(projectList);
          setDocs(docsList);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProjectDocs();

    return () => {
      isMounted = false;
    };
  }, [trpc]);

  const groups = useMemo(() => {
    const projectGroups = projects.map((project) => ({
      id: project.id,
      name: project.name,
      teamName: project.teamName,
      docs: docs.filter((doc) => doc.projectId === project.id),
    }));
    const projectIds = new Set(projects.map((project) => project.id));
    const workspaceDocs = docs.filter(
      (doc) => !doc.projectId || !projectIds.has(doc.projectId),
    );

    return [
      ...projectGroups,
      {
        id: "workspace",
        name: "Workspace",
        docs: workspaceDocs,
      },
    ].filter((group) => group.docs.length > 0 || group.id !== "workspace");
  }, [docs, projects]);

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-hairline/60 bg-surface text-muted-foreground shadow-sm">
            <FolderIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Project docs
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse documentation grouped by active project.
            </p>
          </div>
        </div>
        <CreateDocModal triggerLabel="New project doc" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="rounded-lg">
                <CardHeader>
                  <div className="h-14 animate-pulse rounded-md bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 animate-pulse rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))
          : null}

        {!isLoading && !groups.length ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-12 text-center lg:col-span-2">
            <FolderIcon className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">No project docs yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Attach docs to projects and they will be grouped here.
            </p>
            <div className="mt-4">
              <CreateDocModal triggerLabel="Create project doc" />
            </div>
          </div>
        ) : null}

        {groups.map((group) => {
          return (
            <Card key={group.id} className="rounded-lg shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-2xl border border-hairline/60 bg-surface text-muted-foreground shadow-sm">
                    <FolderIcon className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {group.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {group.docs.length} docs
                      {"teamName" in group && group.teamName
                        ? ` · ${group.teamName}`
                        : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 pt-4">
                {group.docs.map((doc) => (
                  <Link
                    key={`${group.id}-${doc.id}`}
                    href={paths.doc(doc.slug)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hairline/60 bg-surface p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileTextIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {getDocTitle(doc.title)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Updated {formatDocDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <Badge variant="outline">{getDocTeam(doc)}</Badge>
                      <Badge variant="secondary">Doc</Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
