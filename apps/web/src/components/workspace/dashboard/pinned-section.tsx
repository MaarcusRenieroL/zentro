import { Button } from "@zentro/ui/components/shadcn/button";
import { cn } from "@zentro/ui/index";
import {
  CheckSquareIcon,
  FileIcon,
  FolderIcon,
  PenIcon,
  PinIcon,
} from "lucide-react";
import Link from "next/link";
import { FC } from "react";

export const PinnedSection: FC = () => {
  const pinnedItems = [
    {
      id: "1",
      icon: FileIcon,
      type: "doc",
      title: "Q2 Product Roadmap",
      app: "Docs",
      updatedAt: "2h ago",
      href: "/docs/q4-roadmap",
    },
    {
      id: "2",
      icon: FolderIcon,
      type: "project",
      title: "Website Redesign",
      app: "Projects",
      updatedAt: "Updated yesterday",
      href: "/projects/website-redesign",
    },
    {
      id: "3",
      icon: CheckSquareIcon,
      type: "task",
      title: "Sprint Backlog",
      app: "Tasks",
      updatedAt: "Updated 3h ago",
      href: "/tasks?sprint=24",
    },
    {
      id: "4",
      icon: FileIcon,
      type: "doc",
      title: "Design System",
      app: "Docs",
      updatedAt: "Updated 5d ago",
      href: "/docs/design-system",
    },
  ];

  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">Pinned</h2>
        <Button
          variant="link"
          size="sm"
          className="h-6 gap-1 px-0 text-sm font-normal text-muted-foreground hover:text-foreground"
        >
          <PenIcon className="size-3.5" />
          Edit
        </Button>
      </div>
      <div className="space-y-2">
        {pinnedItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex min-w-0 items-center justify-between gap-3 rounded-md border bg-background/60 p-3 transition-colors hover:border-primary/50 hover:bg-secondary/60"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/70">
              <item.icon
                className={cn(
                  "size-4",
                  item.app === "Docs" && "text-blue-500",
                  item.app === "Projects" && "text-pink-500",
                  item.app === "Tasks" && "text-purple-500",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.app} · {item.updatedAt}
              </p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
            >
              <PinIcon className="size-3.5" />
            </Button>
          </Link>
        ))}
      </div>
    </section>
  );
};
