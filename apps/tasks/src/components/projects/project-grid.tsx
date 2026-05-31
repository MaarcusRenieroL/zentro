import { Project, WorkspaceTask } from "~/src/lib/types";
import { ProjectCard } from "./project-card";
import { FC } from "react";

type Props = {
  projects: Project[];
  tasks: WorkspaceTask[];
};

export const ProjectsGrid: FC<Props> = ({ projects, tasks }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          tasks={tasks.filter((task) => task.projectSlug === project.slug)}
        />
      ))}
    </div>
  );
};
