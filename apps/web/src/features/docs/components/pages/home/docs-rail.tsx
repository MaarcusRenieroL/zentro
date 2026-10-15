"use client";

import Link from "next/link";
import type { FC } from "react";
import {
  ClockIcon,
  FileTextIcon,
  FolderIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

import type { DocsListItem } from "../../../lib/docs";

type Props = {
  docs: DocsListItem[];
  /** The project the table is narrowed to; null for every doc. */
  project: string | null;
  onProject: (project: string | null) => void;
};

const item =
  "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The left column of Docs home: docs by project, then the other lists. */
export const DocsRail: FC<Props> = ({ docs, project, onProject }) => {
  const byProject = new Map<string, number>();

  for (const doc of docs) {
    const key = doc.projectName ?? "";

    byProject.set(key, (byProject.get(key) ?? 0) + 1);
  }

  const groups = Array.from(byProject)
    .filter(([name]) => name)
    .sort(([a], [b]) => a.localeCompare(b));
  const loose = byProject.get("") ?? 0;

  return (
    <nav aria-label="Docs" className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="eyebrow px-2 pb-1.5">By project</h2>
        <button
          type="button"
          aria-pressed={project === null}
          onClick={() => onProject(null)}
          className={cn(
            item,
            project === null
              ? "bg-selected font-medium text-ink"
              : "text-ink-2 hover:bg-hover hover:text-ink",
          )}
        >
          <FileTextIcon className="size-4" aria-hidden="true" />
          <span className="flex-1">All docs</span>
          <span className="font-mono text-xs text-ink-3">{docs.length}</span>
        </button>
        {groups.map(([name, count]) => (
          <button
            key={name}
            type="button"
            aria-pressed={project === name}
            onClick={() => onProject(name)}
            className={cn(
              item,
              project === name
                ? "bg-selected font-medium text-ink"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            <FolderIcon className="size-4" aria-hidden="true" />
            <span className="flex-1 truncate">{name}</span>
            <span className="font-mono text-xs text-ink-3">{count}</span>
          </button>
        ))}
        {loose ? (
          <button
            type="button"
            aria-pressed={project === ""}
            onClick={() => onProject("")}
            className={cn(
              item,
              project === ""
                ? "bg-selected font-medium text-ink"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            <FileTextIcon className="size-4" aria-hidden="true" />
            <span className="flex-1">No project</span>
            <span className="font-mono text-xs text-ink-3">{loose}</span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-hairline pt-4">
        {(
          [
            [paths.myDocs(), UserIcon, "My docs"],
            [paths.recentDocs(), ClockIcon, "Recent"],
            [paths.trashedDocs(), Trash2Icon, "Trash"],
          ] as const
        ).map(([href, Icon, label]) => (
          <Link
            key={label}
            href={href}
            className={cn(item, "text-ink-2 hover:bg-hover hover:text-ink")}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
