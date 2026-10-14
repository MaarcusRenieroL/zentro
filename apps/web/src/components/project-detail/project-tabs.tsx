import { FC } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
} from "lucide-react";

import { ActivityFeed } from "~/src/components/workspace/activity/activity-feed";
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "@zentro/ui/shadcn/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Button } from "@zentro/ui/shadcn/button";

type Props = {
  projectId: string;
  description?: string | null;
  totalTasks: number;
  totalDocs: number;
  // Links to a module are only passed when that module is enabled.
  tasksHref?: string;
  docsHref?: string;
};

export const ProjectTabs: FC<Props> = ({
  projectId,
  description,
  totalTasks,
  totalDocs,
  tasksHref,
  docsHref,
}) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="flex-col gap-0">
        <div className="mb-4">
          <TabsList>
            <TabsTrigger value="overview">
              <LayoutDashboardIcon aria-hidden="true" />
              Overview
            </TabsTrigger>
            {tasksHref ? (
              <TabsTrigger value="tasks">
                <ListTodoIcon aria-hidden="true" />
                Tasks
              </TabsTrigger>
            ) : null}
            {docsHref ? (
              <TabsTrigger value="docs">
                <FileTextIcon aria-hidden="true" />
                Docs
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="activity">
              <ActivityIcon aria-hidden="true" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-5">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {description ||
                  "Use this space for the project brief, scope, and next steps."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                selector={{ projectId }}
                emptyText="Nothing has happened in this project yet."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {tasksHref ? (
          <TabsContent value="tasks" className="mt-5">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Tasks</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {totalTasks === 1
                    ? "1 task in this project."
                    : `${totalTasks} tasks in this project.`}
                </p>
                <Button asChild variant="outline">
                  <Link href={tasksHref}>View tasks</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {docsHref ? (
          <TabsContent value="docs" className="mt-5">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Docs</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {totalDocs === 1
                    ? "1 doc in this project."
                    : `${totalDocs} docs in this project.`}
                </p>
                <Button asChild variant="outline">
                  <Link href={docsHref}>View docs</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
};
