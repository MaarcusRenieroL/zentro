import Link from "next/link";
import { ArrowRightIcon, FolderKanbanIcon } from "lucide-react";

import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Project, WorkspaceTask } from "~/src/features/tasks/lib/types";
import { FC } from "react";

type Props = {
  project: Project;
  tasks: WorkspaceTask[];
};

export const ProjectCard: FC<Props> = ({ project, tasks }) => {
  const doneTasks = tasks.filter((task) => task.status === "done").length;

  const progress = tasks.length
    ? Math.round((doneTasks / tasks.length) * 100)
    : 0;

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FolderKanbanIcon className="size-5" />
          </div>

          <Badge variant="secondary">{tasks.length} tasks</Badge>
        </div>

        <CardTitle className="text-base">{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Lead</span>
          <span className="font-medium">{project.lead}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/tasks/projects/${project.slug}`}>
            Open project
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
