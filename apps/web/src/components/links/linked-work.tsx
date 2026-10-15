"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileTextIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { trpcResult } from "~/src/lib/trpc-result";

type Relation =
  | "blocks"
  | "blocked_by"
  | "relates"
  | "mentions"
  | "mentioned_in";

type Item = {
  linkId: string;
  relation: Relation;
  auto: boolean;
  type: "task" | "doc";
  id: string;
  title: string;
  key: string | null;
  status: string | null;
  href: string;
};

type Candidate = {
  type: "task" | "doc";
  id: string;
  /** Task key or doc id: what the add call takes. */
  ref: string;
  title: string;
  key: string | null;
  status: string | null;
};

type Source = { type: "task"; key: string } | { type: "doc"; id: string };

const groups: Array<{ relation: Relation; label: string }> = [
  { relation: "blocked_by", label: "Blocked by" },
  { relation: "blocks", label: "Blocks" },
  { relation: "relates", label: "Related" },
  { relation: "mentions", label: "Mentions" },
  { relation: "mentioned_in", label: "Mentioned in" },
];

const kinds: Array<{
  value: "relates" | "blocks" | "blocked_by";
  label: string;
}> = [
  { value: "relates", label: "Related" },
  { value: "blocks", label: "Blocks" },
  { value: "blocked_by", label: "Blocked by" },
];

function Glyph({ item }: { item: Pick<Item, "type" | "status"> }) {
  return item.type === "task" ? (
    <StatusGlyph status={item.status ?? "todo"} size={13} decorative />
  ) : (
    <FileTextIcon className="size-3.5 text-ink-3" aria-hidden="true" />
  );
}

/**
 * The work this task or doc is connected to: what blocks it, what it blocks,
 * related tasks and docs, and where its key is mentioned. Editors can add
 * and remove links; mentions follow the text that makes them.
 */
export function LinkedWork({
  source,
  canEdit,
  refreshKey,
  selfId,
}: {
  source: Source;
  canEdit: boolean;
  /** Changes when the source's text is saved, so mentions reload. */
  refreshKey?: string;
  /** Left out of the picker. */
  selfId: string;
}) {
  const trpc = useTrpcClient();
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"relates" | "blocks" | "blocked_by">(
    "relates",
  );
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const sourceKey = JSON.stringify(source);

  const load = useCallback(async () => {
    const parsed = JSON.parse(sourceKey) as Source;
    const { data } = await trpcResult(
      parsed.type === "task"
        ? trpc.link.forTask.query({ taskKey: parsed.key })
        : trpc.link.forDoc.query({ docId: parsed.id }),
    );

    setItems((data ?? []) as Item[]);
  }, [trpc, sourceKey]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // The picker loads tasks and docs the first time it opens.
  useEffect(() => {
    if (!open || candidates) return;

    void Promise.all([
      trpc.task.getTasksByOrgId.query({}).catch(() => []),
      trpc.docs.getAll.query({}).catch(() => []),
    ]).then(([tasks, docs]) =>
      setCandidates(
        [
          ...tasks.map((task) => ({
            type: "task" as const,
            ref: task.key,
            title: task.name,
            key: task.key,
            status: task.status,
            id: task.id,
          })),
          ...docs.map((doc) => ({
            type: "doc" as const,
            ref: doc.id,
            title: doc.title || "Untitled",
            key: null,
            status: null,
            id: doc.id,
          })),
        ].filter((candidate) => candidate.id !== selfId),
      ),
    );
  }, [open, candidates, trpc, selfId]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const linked = new Set(items?.map((item) => `${item.type}:${item.id}`));

    return (candidates ?? [])
      .filter(
        (candidate) =>
          (kind === "relates" || candidate.type === "task") &&
          !linked.has(`${candidate.type}:${candidate.id}`) &&
          (!needle ||
            candidate.title.toLowerCase().includes(needle) ||
            candidate.key?.toLowerCase().includes(needle)),
      )
      .slice(0, 8);
  }, [candidates, query, kind, items]);

  const add = async (candidate: Candidate) => {
    const target =
      candidate.type === "task"
        ? { type: "task" as const, key: candidate.ref }
        : { type: "doc" as const, id: candidate.ref };
    const { error } = await trpcResult(
      source.type === "task"
        ? trpc.link.addFromTask.mutate({
            taskKey: source.key,
            target,
            kind,
          })
        : trpc.link.addFromDoc.mutate({ docId: source.id, target }),
    );

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Linked", candidate.key ?? candidate.title);
    setOpen(false);
    setQuery("");
    await load();
  };

  const remove = async (item: Item) => {
    const { error } = await trpcResult(
      trpc.link.remove.mutate({ linkId: item.linkId }),
    );

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    await load();
  };

  return (
    <section aria-label="Linked work" className="tile flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Linked work</h2>
        {canEdit ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="-mr-2 h-7 px-2">
                <PlusIcon />
                Add link
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-2 p-2">
              {source.type === "task" ? (
                <div
                  role="radiogroup"
                  aria-label="Link type"
                  className="flex gap-1 rounded-md bg-sunken p-1"
                >
                  {kinds.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={kind === option.value}
                      onClick={() => setKind(option.value)}
                      className={cn(
                        "flex-1 rounded-sm px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        kind === option.value
                          ? "bg-surface font-medium text-ink shadow-sm"
                          : "text-ink-2 hover:text-ink",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <label className="relative">
                <span className="sr-only">Find a task or doc</span>
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    kind === "relates" ? "Find a task or doc" : "Find a task"
                  }
                  className="h-8 w-full rounded-md border border-hairline bg-surface pr-2 pl-8 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <ul className="flex max-h-64 flex-col overflow-y-auto">
                {candidates === null ? (
                  <li className="px-2 py-3">
                    <Skeleton className="h-4 w-2/3" />
                  </li>
                ) : shown.length ? (
                  shown.map((candidate) => (
                    <li key={`${candidate.type}:${candidate.ref}`}>
                      <button
                        type="button"
                        onClick={() => void add(candidate)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-hover focus-visible:bg-hover"
                      >
                        <Glyph item={candidate} />
                        {candidate.key ? (
                          <span className="font-mono text-xs text-ink-3">
                            {candidate.key}
                          </span>
                        ) : null}
                        <span className="truncate">{candidate.title}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-3 text-[13px] text-ink-3">
                    Nothing matches.
                  </li>
                )}
              </ul>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {items === null ? (
        <Skeleton className="h-10 w-full" />
      ) : items.length === 0 ? (
        <p className="text-[13px] leading-5 text-ink-3">
          {source.type === "task"
            ? "Nothing linked yet. Link what blocks this task, or the doc that specs it. Naming a key like ZEN-12 in text links it too."
            : "Nothing linked yet. Link the tasks this doc is about, or name their keys in the text."}
        </p>
      ) : (
        groups.map(({ relation, label }) => {
          const group = items.filter((item) => item.relation === relation);

          if (!group.length) return null;

          return (
            <div key={relation} className="flex flex-col">
              <span
                className={cn(
                  "pt-1 pb-0.5 font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase",
                  relation === "blocked_by" && "text-danger-text",
                )}
              >
                {label} · {group.length}
              </span>
              <ul>
                {group.map((item) => (
                  <li
                    key={item.linkId}
                    className="group relative flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-hover"
                  >
                    <Glyph item={item} />
                    {item.type === "task" && item.key ? (
                      <span className="font-mono text-xs text-ink-3">
                        {item.key}
                      </span>
                    ) : null}
                    <Link
                      href={item.href}
                      className="min-w-0 flex-1 truncate text-sm outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
                    >
                      {item.title}
                    </Link>
                    {canEdit && !item.auto ? (
                      <button
                        type="button"
                        aria-label={`Remove link to ${item.key ?? item.title}`}
                        onClick={() => void remove(item)}
                        className="relative z-[1] rounded-xs p-0.5 text-ink-3 opacity-0 outline-none group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
