"use client";

import { usePageCrumb } from "~/src/components/shell/breadcrumb-context";
import { paths } from "~/src/lib/paths";
import { useTrpcClient } from "@zentro/api/react";
import { ProjectDetail } from "~/src/lib/types";
import { toWorkspaceTask } from "~/src/features/tasks/lib/to-workspace-task";
import type { WorkspaceTask } from "~/src/features/tasks/lib/types";
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
  const [tasks, setTasks] = useState<WorkspaceTask[] | null>(null);

  const trpc = useTrpcClient();

  usePageCrumb(`/projects/${params.slug}`, project?.name);

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

        // Hidden when the tasks module is off or not readable.
        const taskList = await trpc.task.getTasksByOrgId
          .query({})
          .catch(() => []);

        if (isMounted) {
          setTasks(
            taskList
              .filter((task) => task.projectSlug === params.slug)
              .map(toWorkspaceTask),
          );
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
    <section className="flex w-full flex-col gap-5">
      <ProjectHeader
        slug={project.slug}
        projectId={project.id}
        title={project.name}
        status={project.status}
        description={project.description}
        keyPrefix={project.taskKeyPrefix}
        teamName={project.teamName}
      />

      <ProjectSummary tasks={tasks} totalDocs={project.totalDocs} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ProjectTabs
            projectId={project.id}
            projectSlug={project.slug}
            description={project.description}
            tasks={tasks ?? []}
            totalDocs={project.totalDocs}
            showTasks={enabledModules.includes("tasks")}
            showDocs={enabledModules.includes("docs")}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <ProjectDetails
            status={project.status}
            createdAt={project.createdAt}
            startDate={project.createdAt}
            owner={project.owner}
            teamName={project.teamName}
            keyPrefix={project.taskKeyPrefix}
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
