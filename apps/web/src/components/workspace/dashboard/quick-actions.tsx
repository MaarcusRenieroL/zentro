import { CheckSquareIcon, FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

import type { DashboardData } from "~/src/lib/dashboard-data";

type Props = {
  links: DashboardData["links"];
};

export const QuickActions: FC<Props> = ({ links }) => {
  const actions = [
    { label: "Open tasks", href: links.tasks, icon: CheckSquareIcon },
    { label: "New doc", href: links.newDoc, icon: FileIcon },
    { label: "Projects", href: links.projects, icon: FolderIcon },
  ].filter(
    (action): action is typeof action & { href: string } => !!action.href,
  );

  if (!actions.length) {
    return null;
  }

  return (
    <section className="rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-hairline/60">
      <h2 className="px-3 pt-2 pb-2 font-display text-xl text-ink">
        Quick actions
      </h2>
      <div className="flex flex-col">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sunken"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-signal-subtle text-signal">
              <action.icon className="size-4" />
            </span>
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};
