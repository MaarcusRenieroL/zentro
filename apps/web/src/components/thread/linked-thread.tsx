"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenIcon, CheckCircle2Icon, FolderIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { Thread, ThreadItem } from "@zentro/ui/components/thread";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { paths } from "~/src/lib/paths";

type Related = {
  kind: "task" | "doc";
  id: string;
  label: string;
  meta?: string;
  status?: string;
  href: string;
};

type Props = {
  /** What is on screen now: it gets the live node. */
  current: {
    kind: "task" | "doc";
    label: string;
    meta?: string;
    status?: string;
  };
  projectId: string | null | undefined;
  projectName: string | null | undefined;
  projectSlug?: string | null;
  /** Left out of the list because it is the current item. */
  currentId: string;
  /** Pieces of the page the Thread cannot know, such as comments. */
  extra?: Array<{ id: string; label: string }>;
};

/**
 * The Thread: a 1px line with a node for each linked item (the project, the
 * tasks and docs that share it), and a live node for the item in view.
 */
export function LinkedThread({
  current,
  projectId,
  projectName,
  projectSlug,
  currentId,
  extra = [],
}: Props) {
  const trpc = useTrpcClient();
  const [related, setRelated] = useState<Related[] | null>(null);

  useEffect(() => {
    let live = true;

    if (!projectId || !projectName) {
      setRelated([]);

      return;
    }

    Promise.all([
      trpc.docs.getAll.query({ projectId }).catch(() => []),
      trpc.task.getTasksByOrgId.query().catch(() => []),
    ]).then(([docs, tasks]) => {
      if (!live) return;

      const docItems: Related[] = docs
        .filter((doc) => doc.id !== currentId)
        .slice(0, 3)
        .map((doc) => ({
          kind: "doc",
          id: doc.id,
          label: doc.title,
          meta: "Doc",
          href: paths.doc(doc.slug),
        }));
      const taskItems: Related[] = tasks
        .filter(
          (task) =>
            task.project === projectName &&
            task.id !== currentId &&
            task.status !== "done",
        )
        .slice(0, 3)
        .map((task) => ({
          kind: "task",
          id: task.id,
          label: task.name,
          meta: task.key,
          status: task.status,
          href: paths.task(task.key),
        }));

      setRelated([...taskItems, ...docItems]);
    });

    return () => {
      live = false;
    };
  }, [trpc, projectId, projectName, currentId]);

  return (
    <Thread aria-label="Linked items">
      {projectName ? (
        <ThreadItem>
          <Link
            href={projectSlug ? paths.project(projectSlug) : paths.projects()}
            className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink"
          >
            <FolderIcon className="size-4 text-ink-3" aria-hidden="true" />
            <span className="truncate">{projectName}</span>
            <span className="ml-auto font-mono text-[11px] text-ink-3">
              Project
            </span>
          </Link>
        </ThreadItem>
      ) : null}

      <ThreadItem active>
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          {current.kind === "task" ? (
            <StatusGlyph status={current.status ?? "todo"} size={16} />
          ) : (
            <BookOpenIcon className="size-4 text-ink-3" aria-hidden="true" />
          )}
          <span className="truncate">{current.label}</span>
          {current.meta ? (
            <TaskKey className="ml-auto">{current.meta}</TaskKey>
          ) : null}
        </div>
      </ThreadItem>

      {related === null ? (
        <ThreadItem>
          <Skeleton className="h-5 w-40" />
        </ThreadItem>
      ) : (
        related.map((item) => (
          <ThreadItem key={`${item.kind}-${item.id}`}>
            <Link
              href={item.href}
              className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink"
            >
              {item.kind === "task" ? (
                <StatusGlyph status={item.status ?? "todo"} size={16} />
              ) : (
                <BookOpenIcon
                  className="size-4 text-ink-3"
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{item.label}</span>
              <span className="ml-auto font-mono text-[11px] text-ink-3">
                {item.meta}
              </span>
            </Link>
          </ThreadItem>
        ))
      )}

      {extra.map((item) => (
        <ThreadItem key={item.id}>
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <CheckCircle2Icon
              className="size-4 text-ink-3"
              aria-hidden="true"
            />
            {item.label}
          </div>
        </ThreadItem>
      ))}
    </Thread>
  );
}
