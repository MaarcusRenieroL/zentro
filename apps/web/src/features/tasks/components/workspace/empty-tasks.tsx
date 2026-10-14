import { ListIcon, PlusIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { EmptyState } from "@zentro/ui/components/empty-state";

import { CreateTaskModal } from "../create-task-modal";

export const EmptyTasks = () => {
  return (
    <EmptyState
      icon={<ListIcon className="size-4" aria-hidden="true" />}
      title="No tasks yet"
      description="Create the first task to start tracking work in this workspace."
      action={
        <CreateTaskModal
          trigger={
            <Button variant="outline">
              <PlusIcon className="size-4" />
              Create task
            </Button>
          }
        />
      }
    />
  );
};
