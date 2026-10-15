"use client";

import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { useEffect, useMemo, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";

import { ModuleTabs } from "~/src/components/shell/module-section-nav";

import type { DocsListItem } from "../../../lib/docs";
import { DocTable } from "../../doc-rows";
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

  const [project, setProject] = useState("all");
  const shown = useMemo(
    () =>
      project === "all"
        ? docs.filter((doc) => doc.projectId)
        : docs.filter((doc) => doc.projectId === project),
    [docs, project],
  );

  return (
    <section className="flex w-full flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
          Project docs
        </h1>
        <span className="flex-1" />
        <CreateDocModal />
      </div>
      <ModuleTabs className="mt-4" />

      <div className="mt-3.5 mb-3 flex flex-wrap items-center gap-2">
        <Select
          value={project}
          onValueChange={(value) => value && setProject(value)}
        >
          <SelectTrigger
            aria-label="Project"
            className="h-8 gap-1.5 rounded-md border-hairline bg-transparent px-2.5 text-[13px] shadow-none data-[size=default]:h-8"
          >
            <span className="text-ink-3">Project</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="font-mono text-xs text-ink-3">
          {shown.length} {shown.length === 1 ? "doc" : "docs"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-12" />
          ))}
        </div>
      ) : shown.length ? (
        <DocTable docs={shown} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-serif-italic text-[2.25rem] leading-none">
            No docs in this project yet.
          </p>
          <p className="max-w-[420px] text-sm text-ink-2">
            Docs you create inside a project show up here and on the project
            page.
          </p>
        </div>
      )}
    </section>
  );
}
