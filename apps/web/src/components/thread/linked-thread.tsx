"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { MessageSquareIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Thread, ThreadItem } from "@zentro/ui/components/thread";
import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { formatDueDate } from "@zentro/utils";

import { useReachable } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

type Related = {
  kind: "task" | "doc";
  id: string;
  label: string;
  status?: string;
  sub: string;
  late?: boolean;
  href: string;
};

type Props = {
  /** What is on screen now: it gets the live node. */
  current: {
    kind: "task" | "doc" | "project";
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
  /** Drawn above the line, with how many items are linked. */
  header?: (count: number) => ReactNode;
  /** Shows the conversation about this item, when there is one. */
  discussion?: { type: "task" | "doc" | "project"; id: string };
};

const shortDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

function firstName(name: string | null | undefined) {
  return name ? (name.split(" ")[0] ?? name) : "Unassigned";
}

/** A task's owner and where its date stands, as one short line. */
function taskSub(task: {
  assignee: string | null;
  due: Date | null;
  status: string;
}) {
  const owner = firstName(task.assignee);

  if (task.status === "done") return { sub: `${owner} · done`, late: false };
  if (!task.due) return { sub: `${owner} · no date`, late: false };

  const due = formatDueDate(task.due);

  return due.tone === "overdue"
    ? { sub: `${owner} · overdue ${shortDate(task.due)}`, late: true }
    : { sub: `${owner} · due ${due.text}`, late: false };
}

function Chip({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-hairline font-mono text-[9px] text-ink",
        tint,
      )}
    >
      {children}
    </span>
  );
}

function Entry({
  kind,
  chip,
  title,
  sub,
  subClassName,
  strong = false,
}: {
  kind: string;
  chip: ReactNode;
  title: string;
  sub?: string;
  subClassName?: string;
  strong?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
        {kind}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        {chip}
        <span
          className={cn(
            "truncate text-sm text-ink",
            strong ? "font-semibold" : "font-medium",
          )}
        >
          {title}
        </span>
      </span>
      {sub ? (
        <span className={cn("font-mono text-[11px] text-ink-3", subClassName)}>
          {sub}
        </span>
      ) : null}
    </span>
  );
}

const itemLink =
  "block rounded-md px-2 py-1.5 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring";

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
  header,
  discussion,
}: Props) {
  const trpc = useTrpcClient();
  const chatReachable = useReachable("chat.view");
  const [chat, setChat] = useState<{
    name: string;
    messages: number;
    unread: number;
  } | null>(null);

  useEffect(() => {
    if (!discussion || !chatReachable) return;

    let live = true;

    trpc.chat.discussion
      .query(discussion)
      .then((data) => {
        if (live && data.exists) {
          setChat({
            name: data.name,
            messages: data.messages,
            unread: data.unread,
          });
        }
      })
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [trpc, discussion?.type, discussion?.id, chatReachable]);

  const [related, setRelated] = useState<Related[] | null>(null);
  const [project, setProject] = useState<{
    prefix: string | null;
    open: number;
  } | null>(null);

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

      const inProject = tasks.filter((task) => task.project === projectName);
      const docItems: Related[] = docs
        .filter((doc) => doc.id !== currentId)
        .slice(0, 2)
        .map((doc) => ({
          kind: "doc",
          id: doc.id,
          label: doc.title,
          sub: `Edited ${shortDate(doc.updatedAt)}${doc.createdBy ? ` · ${firstName(doc.createdBy)}` : ""}`,
          href: paths.doc(doc.slug),
        }));
      const taskItems: Related[] = inProject
        .filter((task) => task.id !== currentId && task.status !== "done")
        .slice(0, 3)
        .map((task) => ({
          kind: "task",
          id: task.id,
          label: `${task.key} · ${task.name}`,
          status: task.status,
          ...taskSub(task),
          href: paths.task(task.key),
        }));

      setProject({
        prefix: inProject[0]?.key.split("-")[0] ?? null,
        open: inProject.filter((task) => task.status !== "done").length,
      });
      setRelated([...taskItems, ...docItems]);
    });

    return () => {
      live = false;
    };
  }, [trpc, projectId, projectName, currentId]);

  const count =
    (projectName && current.kind !== "project" ? 1 : 0) +
    1 +
    (chat ? 1 : 0) +
    (related?.length ?? 0) +
    extra.length;

  return (
    <>
      {header?.(count)}
      <Thread aria-label="Linked items">
        {projectName && current.kind !== "project" ? (
          <ThreadItem className="pb-1">
            <Link
              href={projectSlug ? paths.project(projectSlug) : paths.projects()}
              className={itemLink}
            >
              <Entry
                kind="Project"
                chip={
                  <Chip tint="bg-tint-projects">
                    {projectName.charAt(0).toUpperCase()}
                  </Chip>
                }
                title={projectName}
                sub={
                  project
                    ? [
                        project.prefix,
                        `${project.open} open ${project.open === 1 ? "task" : "tasks"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : undefined
                }
              />
            </Link>
          </ThreadItem>
        ) : null}

        <ThreadItem active className="pb-1">
          <div className="px-2 py-1.5">
            <Entry
              kind={`This ${current.kind}`}
              chip={
                current.kind === "task" ? (
                  <StatusGlyph status={current.status ?? "todo"} size={12} />
                ) : current.kind === "project" ? (
                  <Chip tint="bg-tint-projects">
                    {current.label.charAt(0).toUpperCase()}
                  </Chip>
                ) : (
                  <Chip tint="bg-tint-docs">D</Chip>
                )
              }
              title={
                current.meta
                  ? `${current.meta} · ${current.label}`
                  : current.label
              }
              sub="You’re here"
              subClassName="text-signal"
              strong
            />
          </div>
        </ThreadItem>

        {chat ? (
          <ThreadItem className="pb-1">
            <Link href={`/chat/${chat.name}`} className={itemLink}>
              <Entry
                kind="Discussion"
                chip={
                  <span
                    aria-hidden="true"
                    className="flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-hairline bg-tint-teams text-ink"
                  >
                    <MessageSquareIcon className="size-3" />
                  </span>
                }
                title={`#${chat.name}`}
                sub={`${chat.messages} ${chat.messages === 1 ? "message" : "messages"}${chat.unread ? ` · ${chat.unread} new` : ""}`}
              />
            </Link>
          </ThreadItem>
        ) : null}

        {related === null ? (
          <ThreadItem>
            <Skeleton className="mx-2 my-1.5 h-10 w-40" />
          </ThreadItem>
        ) : (
          related.map((item) => (
            <ThreadItem key={`${item.kind}-${item.id}`} className="pb-1">
              <Link href={item.href} className={itemLink}>
                <Entry
                  kind={item.kind === "task" ? "Related task" : "Doc"}
                  chip={
                    item.kind === "task" ? (
                      <StatusGlyph status={item.status ?? "todo"} size={12} />
                    ) : (
                      <Chip tint="bg-tint-docs">D</Chip>
                    )
                  }
                  title={item.label}
                  sub={item.sub}
                  subClassName={item.late ? "text-danger-text" : undefined}
                />
              </Link>
            </ThreadItem>
          ))
        )}

        {extra.map((item) => (
          <ThreadItem key={item.id} className="pb-1">
            <div className="px-2 py-1.5">
              <Entry
                kind="On this page"
                chip={<Chip tint="bg-tint-tasks">C</Chip>}
                title={item.label}
              />
            </div>
          </ThreadItem>
        ))}
      </Thread>
    </>
  );
}
