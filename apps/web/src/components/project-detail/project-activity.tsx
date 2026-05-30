import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { ActivityIcon, CheckCircle2Icon, FileTextIcon } from "lucide-react";
import { FC } from "react";

const activities = [
  {
    id: "created",
    label: "Project created",
    meta: "Initial workspace was set up",
    icon: CheckCircle2Icon,
  },
  {
    id: "docs",
    label: "Docs ready",
    meta: "Attach briefs, specs, and notes here",
    icon: FileTextIcon,
  },
];

export const ProjectActivity: FC = () => {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ActivityIcon className="size-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
              <activity.icon className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {activity.label}
              </p>
              <p className="text-xs text-muted-foreground">{activity.meta}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
