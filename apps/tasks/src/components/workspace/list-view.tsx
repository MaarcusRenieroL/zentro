import Link from "next/link";
import { ClockIcon } from "lucide-react";

import {
  DataTable,
  type DataTableColumnDef,
} from "@zentro/ui/components/data-table";
import { Badge } from "@zentro/ui/shadcn/badge";
import { cn } from "@zentro/ui/lib/utils";
import { WorkspaceTask } from "~/src/lib/types";
import { priorityStyles, statusLabels } from "~/src/lib/constants";
import { EmptyTasks } from "./empty-tasks";
import { FC } from "react";

const listColumns: DataTableColumnDef<WorkspaceTask>[] = [
  {
    accessorKey: "title",
    header: "Task",
    meta: {
      label: "Task",
      className: "min-w-72",
    },
    cell: ({ row }) => {
      const task = row.original;

      return (
        <div className="min-w-0">
          <Link
            href={`/tasks/${task.key}`}
            className="font-medium hover:underline"
          >
            {task.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{task.key}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "projectName",
    header: "Project",
    meta: {
      label: "Project",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      label: "Status",
    },
    cell: ({ row }) => (
      <Badge variant="secondary">{statusLabels[row.original.status]}</Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    meta: {
      label: "Priority",
    },
    cell: ({ row }) => (
      <span
        className={cn(
          "text-sm font-medium capitalize",
          priorityStyles[row.original.priority],
        )}
      >
        {row.original.priority}
      </span>
    ),
  },
  {
    accessorKey: "assignee",
    header: "Assignee",
    meta: {
      label: "Assignee",
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    meta: {
      label: "Due",
    },
  },
  {
    accessorKey: "logged",
    header: "Logged",
    meta: {
      label: "Logged",
    },
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <ClockIcon className="size-3.5" />
        {row.original.logged}
      </span>
    ),
  },
];

type Props = {
  tasks: WorkspaceTask[];
};

export const ListView: FC<Props> = ({ tasks }) => {
  if (!tasks.length) return <EmptyTasks />;

  return (
    <DataTable
      columns={listColumns}
      data={tasks}
      emptyMessage="No tasks found."
      filterPlaceholder="Search tasks..."
      getRowId={(task) => task.id}
      initialPageSize={10}
      searchColumn="title"
      showPagination={false}
      showRowSelection={false}
    />
  );
};
