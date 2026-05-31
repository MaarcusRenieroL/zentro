import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon } from "lucide-react";

import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";

import { workLogEvents, workspaceTasks } from "~/src/lib/data";

type Props = {
  params: Promise<{
    taskId: string;
  }>;
};

export default async function TaskDetailPage({ params }: Props) {
  const { taskId } = await params;
  const task = workspaceTasks.find((item) => item.id === taskId);

  if (!task) {
    notFound();
  }

  const logs = workLogEvents.filter((event) => event.taskId === task.id);

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-4 border-b pb-5">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/tasks">
            <ArrowLeftIcon className="size-4" />
            Back to tasks
          </Link>
        </Button>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{task.id}</Badge>
            <Badge variant="secondary">{task.projectName}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {task.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {task.description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
            <CardDescription>
              Task context and implementation notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {task.description} This area will become the editable task
              description once the backend and editor are wired.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="size-4" />
                  Assignee
                </span>
                <span className="font-medium">{task.assignee}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="size-4" />
                  Due date
                </span>
                <span className="font-medium">{task.dueDate}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <ClockIcon className="size-4" />
                  Logged
                </span>
                <span className="font-medium">{task.logged}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Work log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="text-sm">
                    <p>
                      <span className="font-medium">{log.actor}</span>{" "}
                      <span className="text-muted-foreground">
                        {log.action}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {log.time}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No work has been logged yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
