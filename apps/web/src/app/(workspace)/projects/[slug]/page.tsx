"use client";

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
import { ProjectActivity } from "~/src/components/project-detail/project-activity";
import { ProjectPageLoading } from "~/src/components/project-detail/project-loading";

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);

  const trpc = useTrpcClient();

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const data = await trpc.project.getProjectBySlug.query({
          slug: params.slug,
        });

        if (isMounted) {
          setProject(data as ProjectDetail);
        }
      } catch {
        toastError("Error", "Project not found");
        router.replace("/projects");
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
          <ProjectTabs description={project.description} />
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
          <ProjectActivity />
        </aside>
      </div>
    </section>
  );
}
