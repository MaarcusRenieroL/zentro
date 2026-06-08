import { cn } from "@zentro/ui/index";
import { CheckSquareIcon, FileIcon, FolderIcon, PinIcon } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

import type { DashboardWorkItem } from "~/src/lib/dashboard-data";

type Props = {
  items: DashboardWorkItem[];
};

const iconByKind = {
  doc: FileIcon,
  project: FolderIcon,
  task: CheckSquareIcon,
};

export const PinnedSection: FC<Props> = ({ items }) => {
  return (
    <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">Recent work</h2>
      </div>

      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = iconByKind[item.kind];

            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-md border bg-background/60 p-3 transition-colors hover:border-primary/50 hover:bg-secondary/60"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/70">
                  <Icon
                    className={cn(
                      "size-4",
                      item.kind === "doc" && "text-blue-500",
                      item.kind === "project" && "text-pink-500",
                      item.kind === "task" && "text-purple-500",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.label} · {item.updatedAt}
                  </p>
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                  <PinIcon className="size-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-background/50 px-4 py-8 text-center">
          <p className="text-sm font-medium">No recent work yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Projects, docs, and tasks will appear here once they are created.
          </p>
        </div>
      )}
    </section>
  );
};
