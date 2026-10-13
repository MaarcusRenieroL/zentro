import { ProjectsGrid } from "~/src/features/tasks/components/projects/project-grid";
import { projects, workspaceTasks } from "~/src/features/tasks/lib/data";

export default function ProjectsPage() {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-2 border-b pb-5">
        <p className="text-sm font-medium text-muted-foreground">Projects</p>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Project workspaces
        </h1>

        <p className="max-w-2xl text-sm text-muted-foreground">
          Open a project to manage its tasks in board, list, or calendar view.
        </p>
      </div>

      <ProjectsGrid projects={projects} tasks={workspaceTasks} />
    </section>
  );
}
