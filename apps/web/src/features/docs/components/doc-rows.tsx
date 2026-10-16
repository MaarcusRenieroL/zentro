"use client";

import Link from "next/link";
import { useMemo, type FC } from "react";
import {
  FileTextIcon,
  CopyIcon,
  FolderIcon,
  SparklesIcon,
  ExternalLinkIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { StarButton } from "~/src/components/favorites/star-button";
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
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-hairline/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
        Workspace
      </span>
    );
  }

  return (
    <span
      title={doc.projectName}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-ink font-medium shadow-2xs",
        tintFor(doc.projectName),
      )}
    >
      <span className="size-1.5 rounded-full bg-ink/60" />
      <span className="truncate">{doc.projectKey ?? getDocProject(doc)}</span>
    </span>
  );
}

/** Docs as clean modern cards with star favorites and hover tools. */
export const DocTiles: FC<{ docs: DocsListItem[]; columns?: string }> = ({
  docs,
  columns = "sm:grid-cols-2 xl:grid-cols-4",
}) => {
  const handleCopyLink = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/docs/${slug}`;
    void navigator.clipboard.writeText(url).then(() => {
      toastSuccess("Link copied to clipboard");
    });
  };

  return (
    <div className={cn("grid gap-3.5", columns)}>
      {docs.map((doc) => {
        const owner = getDocOwner(doc);
        const title = getDocTitle(doc.title);
        const isSpec =
          title.toLowerCase().includes("spec") ||
          title.toLowerCase().includes("prd") ||
          title.toLowerCase().includes("rfc");

        return (
          <div
            key={doc.id}
            className="group relative flex min-h-[160px] flex-col justify-between rounded-xl border border-hairline bg-surface/60 p-4 transition-all hover:border-signal/40 hover:bg-surface hover:shadow-xs focus-within:ring-2 focus-within:ring-ring"
          >
            {/* Top Bar with Project Chip & Quick Actions */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <ProjectChip doc={doc} />

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, doc.slug)}
                  className="p-1 rounded text-ink-3 hover:text-ink hover:bg-muted"
                  title="Copy link"
                >
                  <CopyIcon className="size-3.5" />
                </button>
                <StarButton
                  type="doc"
                  id={doc.id}
                  title={title}
                  href={`/docs/${doc.slug}`}
                  className="size-6 p-0.5"
                />
              </div>
            </div>

            {/* Document Title & Excerpt */}
            <div className="flex-1 min-w-0">
              <Link
                href={paths.doc(doc.slug)}
                className="flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-signal transition-colors outline-none"
              >
                {isSpec && (
                  <SparklesIcon className="size-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{title}</span>
              </Link>

              {doc.excerpt ? (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-3">
                  {doc.excerpt}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-ink-4 italic">
                  No preview text available
                </p>
              )}
            </div>

            {/* Footer with Creator & Relative Timestamp */}
            <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-hairline/60 text-xs text-ink-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <ActorAvatar name={owner} size={18} />
                <span className="truncate text-[11px] text-ink-3">{owner}</span>
              </div>
              <span className="font-mono text-[11px] text-ink-3 shrink-0">
                {formatDocDate(doc.updatedAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Docs as structured rows: title, project, owner, edited, and actions. */
export const DocTable: FC<{ docs: DocsListItem[] }> = ({ docs }) => {
  const handleCopyLink = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/docs/${slug}`;
    void navigator.clipboard.writeText(url).then(() => {
      toastSuccess("Link copied to clipboard");
    });
  };

  return (
    <div
      role="table"
      aria-label="Docs"
      className="flex flex-col rounded-xl border border-hairline bg-surface/40 overflow-hidden"
    >
      <div
        role="row"
        className="hidden h-9 items-center gap-3 border-b border-hairline bg-surface/80 px-4 font-mono text-[11px] font-medium tracking-[0.08em] text-ink-3 sm:flex"
      >
        <span role="columnheader" className="flex-1">
          DOCUMENT
        </span>
        <span role="columnheader" className="w-36">
          PROJECT
        </span>
        <span role="columnheader" className="w-40">
          OWNER
        </span>
        <span role="columnheader" className="w-24 text-right">
          UPDATED
        </span>
        <span role="columnheader" className="w-16 text-right">
          ACTIONS
        </span>
      </div>

      <div className="divide-y divide-hairline/60">
        {docs.map((doc) => {
          const owner = getDocOwner(doc);
          const title = getDocTitle(doc.title);

          return (
            <div
              role="row"
              key={doc.id}
              className="group relative flex min-h-12 items-center gap-3 px-4 py-2 hover:bg-hover transition-colors"
            >
              <span
                role="cell"
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                <FileTextIcon
                  className="size-4 shrink-0 text-ink-3 group-hover:text-signal transition-colors"
                  aria-hidden="true"
                />
                <Link
                  href={paths.doc(doc.slug)}
                  className="truncate text-[14px] font-medium text-ink hover:text-signal outline-none"
                >
                  {title}
                </Link>
                {doc.excerpt && (
                  <span className="hidden lg:inline truncate text-xs text-ink-4 max-w-xs">
                    — {doc.excerpt}
                  </span>
                )}
              </span>

              <span role="cell" className="hidden w-36 sm:block">
                <ProjectChip doc={doc} />
              </span>

              <span
                role="cell"
                className="hidden w-40 items-center gap-2 text-xs sm:flex"
              >
                <ActorAvatar name={owner} size={20} />
                <span className="truncate text-ink-2">{owner}</span>
              </span>

              <span
                role="cell"
                className="w-24 text-right font-mono text-xs text-ink-3"
              >
                {formatDocDate(doc.updatedAt)}
              </span>

              <span
                role="cell"
                className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, doc.slug)}
                  className="p-1 rounded text-ink-3 hover:text-ink hover:bg-muted"
                  title="Copy link"
                >
                  <CopyIcon className="size-3.5" />
                </button>
                <StarButton
                  type="doc"
                  id={doc.id}
                  title={title}
                  href={`/docs/${doc.slug}`}
                  className="size-6 p-0.5"
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Docs grouped by project cluster. */
export const DocGrouped: FC<{ docs: DocsListItem[] }> = ({ docs }) => {
  const groups = useMemo(() => {
    const map = new Map<string, DocsListItem[]>();
    for (const doc of docs) {
      const key = doc.projectName || "Workspace Docs";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [docs]);

  return (
    <div className="flex flex-col gap-6">
      {groups.map(([projectName, projectDocs]) => (
        <div key={projectName} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-hairline/80">
            <div className="flex size-6 items-center justify-center rounded-md bg-tint-projects font-mono text-[10px] text-ink">
              <FolderIcon className="size-3.5" />
            </div>
            <h3 className="font-semibold text-sm text-ink">{projectName}</h3>
            <span className="font-mono text-xs text-ink-3">
              ({projectDocs.length})
            </span>
          </div>

          <DocTiles
            docs={projectDocs}
            columns="sm:grid-cols-2 xl:grid-cols-3"
          />
        </div>
      ))}
    </div>
  );
};
