import { Button } from "@zentro/ui/components/shadcn/button";
import { CheckSquareIcon, FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

import type { DashboardData } from "~/src/lib/dashboard-data";

type Props = {
  links: DashboardData["links"];
};

export const QuickActions: FC<Props> = ({ links }) => {
  const actions = [
    {
      label: "Open tasks",
      href: links.tasks,
      icon: CheckSquareIcon,
      className: "text-purple-500",
    },
    {
      label: "New doc",
      href: links.newDoc,
      icon: FileIcon,
      className: "text-blue-500",
    },
    {
      label: "Projects",
      href: links.projects,
      icon: FolderIcon,
      className: "text-pink-500",
    },
  ];

  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-medium">Quick actions</h2>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action) => (
          <Button
            key={action.label}
            asChild
            variant="secondary"
            size="lg"
            className="h-11 min-w-0 justify-start gap-2 rounded-md border bg-background/60 px-3 font-normal text-foreground hover:bg-secondary/70"
          >
            <Link href={action.href}>
              <action.icon className={`size-4 ${action.className}`} />
              <span className="truncate">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
};
