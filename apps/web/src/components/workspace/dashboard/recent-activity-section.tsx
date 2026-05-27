import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckSquareIcon,
  FileTextIcon,
  MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { FC } from "react";

export const RecentActivitySection: FC = () => {
  const recentActivity = [
    {
      id: "1",
      user: "Sarah Chen",
      userInitials: "SC",
      action: "completed",
      target: "Update landing page copy",
      app: "Tasks",
      time: "5 min ago",
      icon: CheckCircle2Icon,
      href: "/tasks/update-landing",
    },
    {
      id: "2",
      user: "Mike Johnson",
      userInitials: "MJ",
      action: "commented on",
      target: "API Documentation",
      app: "Docs",
      time: "12 min ago",
      icon: MessageCircleIcon,
      href: "/docs/api-documentation",
    },
    {
      id: "3",
      user: "Roronoa Zoro",
      userInitials: "RZ",
      action: "pushed 3 commits to",
      target: "main",
      app: "Projects",
      time: "28 min ago",
      icon: CheckSquareIcon,
      href: "/projects/main",
    },
    {
      id: "4",
      user: "You",
      userInitials: "JD",
      action: "created",
      target: "Design System Components",
      app: "Docs",
      time: "1 hour ago",
      icon: FileTextIcon,
      href: "/docs/design-system",
    },
    {
      id: "5",
      user: "Emily Davis",
      userInitials: "ED",
      action: "assigned you to",
      target: "Review PR #142",
      app: "Tasks",
      time: "2 hours ago",
      icon: AlertCircleIcon,
      href: "/tasks/review-pr-142",
    },
    {
      id: "6",
      user: "Alex Rivera",
      userInitials: "AR",
      action: "mentioned you in",
      target: "Team standup",
      app: "Chat",
      time: "3 hours ago",
      icon: MessageCircleIcon,
      href: "/chat/team-standup",
    },
  ];

  return (
    <section className="h-full rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">
          Recent activity
        </h2>
        <Link
          href="/activity"
          className="text-sm text-primary hover:text-primary/80"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-border">
        {recentActivity.map((activity) => (
          <Link
            key={activity.id}
            href={activity.href}
            className="group flex min-w-0 items-start gap-3 py-4 first:pt-0 last:pb-0 sm:items-center sm:gap-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
              {activity.userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground sm:truncate">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activity.app} · {activity.time}
              </p>
            </div>
            <activity.icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
};
