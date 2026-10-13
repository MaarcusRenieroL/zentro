"use client";

import { paths } from "~/src/lib/paths";
import { useTrpcClient } from "@zentro/api/react";
import { ProjectDetail } from "~/src/lib/types";
import { toastError } from "@zentro/ui/index";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectDetails } from "~/src/components/project-detail/project-details";
import { ProjectHeader } from "~/src/components/project-detail/project-header";
import { ProjectContributors } from "~/src/components/project-detail/project-contributors";
import { ProjectSummary } from "~/src/components/project-detail/project-summary";
import { ProjectTabs } from "~/src/components/project-detail/project-tabs";
import { ProjectPageLoading } from "~/src/components/project-detail/project-loading";

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  const trpc = useTrpcClient();

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const data = await trpc.project.getProjectBySlug.query({
          slug: params.slug,
        });

        // Needs modules.view; a project role alone does not carry it, so the
        // links to tasks and docs are offered and the module pages decide.
        const moduleList = await trpc.modules.list.query().catch(() => null);

        if (isMounted) {
          setProject(data as ProjectDetail);
          setEnabledModules(
            moduleList
              ? moduleList.modules
                  .filter((module) => module.enabled)
                  .map((module) => module.id)
              : ["tasks", "docs"],
          );
        }
      } catch {
        toastError("Error", "Project not found");
        router.replace(paths.projects());
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [params.slug, router, trpc]);

  if (project == null) {
    return <ProjectPageLoading />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-8 xl:px-10">
      <ProjectHeader
        slug={project.slug}
        projectId={project.id}
        title={project.name}
        status={project.status}
        description={project.description}
      />

      <ProjectSummary
        openTasks={project.openTasks}
        totalTasks={project.totalTasks}
        totalMembers={project.totalMembers}
        totalDocs={project.totalDocs}
        updatedAt={project.updatedAt}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ProjectTabs
            projectId={project.id}
            description={project.description}
            totalTasks={project.totalTasks}
            totalDocs={project.totalDocs}
            tasksHref={
              enabledModules.includes("tasks")
                ? paths.tasksForProject(project.slug)
                : undefined
            }
            docsHref={
              enabledModules.includes("docs") ? paths.projectDocs() : undefined
            }
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <ProjectDetails
            status={project.status}
            createdAt={project.createdAt}
            startDate={project.createdAt}
            owner={project.owner}
          />
          <ProjectContributors
            owner={project.owner}
            totalMembers={project.totalMembers}
          />
        </aside>
      </div>
    </section>
  );
}
