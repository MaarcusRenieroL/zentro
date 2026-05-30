import { FC } from "react";
import {
  ActivityIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
} from "lucide-react";
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
import { Badge } from "@zentro/ui/shadcn/badge";

type Props = {
  description?: string | null;
};

const sampleTasks = [
  { title: "Define project scope", status: "Todo", priority: "High" },
  { title: "Invite contributors", status: "Ready", priority: "Medium" },
  { title: "Add project documents", status: "Backlog", priority: "Low" },
];

export const ProjectTabs: FC<Props> = ({ description }) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="flex-col gap-0">
        <div className="border-b">
          <TabsList variant="line">
            <TabsTrigger value="overview">
              <LayoutDashboardIcon aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodoIcon aria-hidden="true" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileTextIcon aria-hidden="true" />
              Docs
            </TabsTrigger>
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

        <TabsContent value="tasks" className="mt-5">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tasks</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {sampleTasks.map((task) => (
                <div
                  key={task.title}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.priority} priority
                    </p>
                  </div>
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-5">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Docs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed p-8 text-center">
                <FileTextIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No docs attached yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add specs, briefs, and handoff notes when docs are connected.
                </p>
              </div>
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
              <div className="rounded-md border border-dashed p-8 text-center">
                <ActivityIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No timeline yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Project events will appear here as the workspace grows.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
