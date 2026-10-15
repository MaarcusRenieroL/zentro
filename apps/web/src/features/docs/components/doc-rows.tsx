"use client";

import Link from "next/link";
import type { FC } from "react";
import { FileTextIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { paths } from "~/src/lib/paths";

import {
  formatDocDate,
  getDocOwner,
  getDocProject,
  getDocTitle,
  type DocsListItem,
} from "../lib/docs";

const projectTints = [
  "bg-tint-tasks",
  "bg-tint-projects",
  "bg-tint-docs",
  "bg-tint-teams",
  "bg-tint-audit",
] as const;

function tintFor(seed: string) {
  let hash = 0;

  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return projectTints[hash % projectTints.length];
}

/** The project as a small tinted mono chip, or "No project". */
export function ProjectChip({ doc }: { doc: DocsListItem }) {
  if (!doc.projectName) {
    return <span className="text-xs text-ink-3">No project</span>;
  }

  return (
    <span
      title={doc.projectName}
      className={cn(
        "inline-flex max-w-full items-center rounded-xs border border-hairline px-1.5 font-mono text-[11px] text-ink",
        tintFor(doc.projectName),
      )}
    >
      <span className="truncate">{getDocProject(doc)}</span>
    </span>
  );
}

/** Docs as rows: title, project, owner, edited. No card per item. */
export const DocTable: FC<{ docs: DocsListItem[] }> = ({ docs }) => (
  <div role="table" aria-label="Docs" className="flex flex-col">
    <div
      role="row"
      className="hidden h-9 items-center gap-3 border-b border-hairline px-3 font-mono text-[11px] tracking-[0.08em] text-ink-3 sm:flex"
    >
      <span role="columnheader" className="flex-1">
        TITLE
      </span>
      <span role="columnheader" className="w-32">
        PROJECT
      </span>
      <span role="columnheader" className="w-44">
        OWNER
      </span>
      <span role="columnheader" className="w-24 text-right">
        EDITED
      </span>
    </div>
    {docs.map((doc) => {
      const owner = getDocOwner(doc);

      return (
        <div
          role="row"
          key={doc.id}
          className="relative flex min-h-14 items-center gap-3 rounded-xl border-b border-hairline/60 px-3 py-2 hover:bg-hover"
        >
          <span
            role="cell"
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <FileTextIcon
              className="size-4 shrink-0 text-ink-3"
              aria-hidden="true"
            />
            <Link
              href={paths.doc(doc.slug)}
              className="truncate text-[15px] outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {getDocTitle(doc.title)}
            </Link>
          </span>
          <span role="cell" className="hidden w-32 sm:block">
            <ProjectChip doc={doc} />
          </span>
          <span
            role="cell"
            className="hidden w-44 items-center gap-2 text-sm sm:flex"
          >
            <ActorAvatar name={owner} size={24} />
            <span className="truncate">{owner}</span>
          </span>
          <span
            role="cell"
            className="w-24 text-right font-mono text-xs text-ink-3"
          >
            {formatDocDate(doc.updatedAt)}
          </span>
        </div>
      );
    })}
  </div>
);

/** Docs as peach tiles (the Grid view and the Recent strip). */
export const DocTiles: FC<{ docs: DocsListItem[]; columns?: string }> = ({
  docs,
  columns = "sm:grid-cols-2 xl:grid-cols-4",
}) => (
  <div className={cn("grid gap-3", columns)}>
    {docs.map((doc) => {
      const owner = getDocOwner(doc);

      return (
        <Link
          key={doc.id}
          href={paths.doc(doc.slug)}
          className="tile flex min-h-[124px] flex-col gap-2 bg-tint-docs! p-4 outline-none hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex">
            <ProjectChip doc={doc} />
          </span>
          <span className="text-[15px] leading-5 font-semibold">
            {getDocTitle(doc.title)}
          </span>
          <span className="mt-auto flex items-center gap-2 text-xs text-ink-2">
            <ActorAvatar name={owner} size={20} />
            <span className="truncate">{owner}</span>
            <span className="flex-1" />
            <span className="font-mono">{formatDocDate(doc.updatedAt)}</span>
          </span>
        </Link>
      );
    })}
  </div>
);
