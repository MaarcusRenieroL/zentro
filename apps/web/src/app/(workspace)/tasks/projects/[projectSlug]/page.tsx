import { notFound } from "next/navigation";

import {
  projects,
  workLogEvents,
  workspaceTasks,
} from "~/src/features/tasks/lib/data";
import { TaskWorkspace } from "~/src/features/tasks/components/workspace/task-workspace";

type Props = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectTasksPage({ params }: Props) {
  const { projectSlug } = await params;
  const project = projects.find((item) => item.slug === projectSlug);

  if (!project) {
    notFound();
  }

  const tasks = workspaceTasks.filter(
    (task) => task.projectSlug === project.slug,
  );

  const taskIds = new Set(tasks.map((task) => task.id));
  const logs = workLogEvents.filter((event) => taskIds.has(event.taskId));

  return (
    <TaskWorkspace
      title={project.name}
      description={project.description}
      tasks={tasks}
      logs={logs}
      projectScoped
    />
  );
}
