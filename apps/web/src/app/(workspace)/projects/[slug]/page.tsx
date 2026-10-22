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
import {
  ProjectContributors,
  type Contributor,
} from "~/src/components/project-detail/project-contributors";
import type { ProjectListItem } from "~/src/components/projects/list";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { DiscussionPanel } from "~/src/components/chat/discussion-panel";
import { LinkedThread } from "~/src/components/thread/linked-thread";
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
  const canManage = usePermission(
    "projects.settings.manage",
    project ? { projectId: project.id } : undefined,
  );

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

  const list = tasks ?? [];
  const now = Date.now();
  // Health is read from the tasks, as on the projects list.
  const health: ProjectListItem = {
    ...project,
    teamId: null,
    teamColor: null,
    teamName: project.teamName ?? null,
    totalTasks: tasks ? list.length : null,
    doneTasks: list.filter((task) => task.status === "done").length,
    overdueTasks: list.filter(
      (task) =>
        task.status !== "done" &&
        task.dueAt &&
        new Date(task.dueAt).getTime() < now,
    ).length,
    startedTasks: list.filter((task) =>
      ["in-progress", "review", "done"].includes(task.status),
    ).length,
  };
  const openBy = new Map<string, number>();

  for (const task of list) {
    if (task.assignee === "Unassigned") continue;
    openBy.set(
      task.assignee,
      (openBy.get(task.assignee) ?? 0) + (task.status === "done" ? 0 : 1),
    );
  }
  const contributors: Contributor[] = [
    {
      name: project.owner,
      open: openBy.get(project.owner) ?? 0,
      lead: true,
    },
    ...Array.from(openBy, ([name, open]) => ({ name, open, lead: false }))
      .filter((person) => person.name !== project.owner)
      .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name)),
  ];

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
        health={health}
      />

      <ProjectSummary tasks={tasks} totalDocs={project.totalDocs} />

      <ProjectTabs
        projectId={project.id}
        projectSlug={project.slug}
        description={project.description}
        tasks={tasks ?? []}
        totalDocs={project.totalDocs}
        showTasks={enabledModules.includes("tasks")}
        showDocs={enabledModules.includes("docs")}
        brief={{
          owner: project.owner,
          updatedAt: project.updatedAt,
          editHref: canManage ? paths.projectSettings(project.slug) : null,
          contributors: <ProjectContributors contributors={contributors} />,
        }}
        aside={
          <>
            <ProjectDetails
              project={health}
              owner={project.owner}
              startDate={project.createdAt}
              teamName={project.teamName}
              keyPrefix={project.taskKeyPrefix}
              people={contributors.map((person) => person.name)}
              manageHref={
                canManage ? paths.projectSettingsAccess(project.slug) : null
              }
            />
            <section aria-label="Thread" className="tile p-4">
              <LinkedThread
                header={(count) => (
                  <div className="flex items-baseline justify-between pb-3">
                    <h2 className="eyebrow">Thread</h2>
                    <span className="font-mono text-xs text-ink-3">
                      {count} linked
                    </span>
                  </div>
                )}
                current={{ kind: "project", label: project.name }}
                currentId={project.id}
                projectId={project.id}
                projectName={project.name}
                projectSlug={project.slug}
                discussion={{ type: "project", id: project.id }}
              />
            </section>
            <DiscussionPanel type="project" id={project.id} />
          </>
        }
      />
    </section>
  );
}
