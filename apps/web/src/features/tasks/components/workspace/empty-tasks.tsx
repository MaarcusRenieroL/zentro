import { ListIcon } from "lucide-react";

import { EmptyState } from "@zentro/ui/components/empty-state";

import { CreateTaskModal } from "../create-task-modal";

export const EmptyTasks = () => {
  return (
    <EmptyState
      icon={<ListIcon className="size-4" aria-hidden="true" />}
      title="No tasks yet"
      description="Create the first task to start tracking work in this workspace."
      action={<CreateTaskModal />}
    />
  );
};
