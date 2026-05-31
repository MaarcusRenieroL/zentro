import { TaskWorkspace } from "~/src/components/workspace/task-workspace";
import { workLogEvents, workspaceTasks } from "~/src/lib/data";

export default function TasksPage() {
  return (
    <TaskWorkspace
      title="Tasks"
      description="Plan, sort, and track every task across your projects."
      tasks={workspaceTasks}
      logs={workLogEvents}
    />
  );
}
