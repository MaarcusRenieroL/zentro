import { CheckSquareIcon, FileIcon, FolderIcon } from "lucide-react";
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
    <section className="rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-hairline/60">
      <h2 className="px-3 pt-2 pb-2 font-display text-xl text-ink">
        Recent work
      </h2>

      {items.length ? (
        <div className="flex flex-col">
          {items.map((item) => {
            const Icon = iconByKind[item.kind];

            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-sunken"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-2">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-ink-3">
                    {item.label} · {item.updatedAt}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="m-1 rounded-2xl bg-sunken px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink">No recent work yet</p>
          <p className="mt-1 text-xs text-ink-2">
            Projects, docs, and tasks will appear here once they are created.
          </p>
        </div>
      )}
    </section>
  );
};
