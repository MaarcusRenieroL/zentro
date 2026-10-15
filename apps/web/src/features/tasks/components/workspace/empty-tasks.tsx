import { ListIcon, PlusIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { EmptyState } from "@zentro/ui/components/empty-state";

import { CreateTaskModal } from "../create-task-modal";

type Props = {
  /** Tasks exist, but the filters hide all of them. */
  filtered?: {
    /** What the filters ask for, e.g. "High priority in Platform". */
    summary: string;
    total: number;
    onClear: () => void;
  };
};

export const EmptyTasks = ({ filtered }: Props = {}) => {
  if (filtered) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-18 text-center">
        <p className="font-serif-italic text-[2.5rem] leading-none text-balance">
          No tasks match these filters.
        </p>
        <p className="max-w-[420px] text-[15px] text-ink-2">
          Nothing is {filtered.summary}. Clear the filters to see all{" "}
          {filtered.total} {filtered.total === 1 ? "task" : "tasks"}.
        </p>
        <Button
          variant="outline"
          onClick={filtered.onClear}
          className="mt-1.5 h-9 border-hairline bg-transparent px-3.5 text-sm"
        >
          Clear filters
        </Button>
      </div>
    );
  }

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
