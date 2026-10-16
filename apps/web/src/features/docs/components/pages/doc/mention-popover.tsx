"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquareIcon,
  FileTextIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { ActorAvatar } from "~/src/components/actor-avatar";

export type MentionItem = {
  type: "task" | "member" | "doc";
  id: string;
  title: string;
  subtitle?: string;
  link: string;
  status?: string;
  avatar?: string;
};

interface MentionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MentionItem) => void;
  position?: { top: number; left: number };
}

export const MentionPopover: FC<MentionPopoverProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const trpc = useTrpcClient();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "task" | "member" | "doc">("all");
  const [tasks, setTasks] = useState<
    Array<{ id: string; key: string; name: string; status: string }>
  >([]);
  const [members, setMembers] = useState<
    Array<{ id: string; name: string | null; email: string }>
  >([]);
  const [docs, setDocs] = useState<
    Array<{ id: string; slug: string; title: string }>
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    // Fetch tasks, members, and docs in parallel
    void trpc.task.getTasksByOrgId
      .query({})
      .then((res) => setTasks(res ?? []))
      .catch(() => setTasks([]));

    void trpc.member.getMembers
      .query()
      .then((res) => setMembers(res ?? []))
      .catch(() => setMembers([]));

    void trpc.docs.getAll
      .query({})
      .then((res) => setDocs(res ?? []))
      .catch(() => setDocs([]));
  }, [isOpen, trpc]);

  const items: MentionItem[] = useMemo(() => {
    const list: MentionItem[] = [];
    const q = query.toLowerCase().trim();

    if (tab === "all" || tab === "task") {
      for (const t of tasks) {
        if (
          !q ||
          t.key.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
        ) {
          list.push({
            type: "task",
            id: t.id,
            title: `${t.key}: ${t.name}`,
            subtitle: `Task · ${t.status}`,
            link: `/tasks/${t.key}`,
            status: t.status,
          });
        }
      }
    }

    if (tab === "all" || tab === "member") {
      for (const m of members) {
        const memberName = m.name || m.email;
        if (!q || memberName.toLowerCase().includes(q)) {
          list.push({
            type: "member",
            id: m.id,
            title: memberName,
            subtitle: "Teammate",
            link: "/workspace/settings/team",
            avatar: memberName,
          });
        }
      }
    }

    if (tab === "all" || tab === "doc") {
      for (const d of docs) {
        if (
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q)
        ) {
          list.push({
            type: "doc",
            id: d.id,
            title: d.title,
            subtitle: "Document",
            link: `/docs/${d.slug}`,
          });
        }
      }
    }

    return list.slice(0, 30);
  }, [query, tab, tasks, members, docs]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + items.length) % Math.max(1, items.length),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        onSelect(items[selectedIndex]);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Mention a task, member, or doc"
      className="absolute top-12 left-4 z-50 flex w-[380px] flex-col rounded-2xl border border-hairline bg-surface p-2 shadow-lg transition-all dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
      onKeyDown={handleKeyDown}
    >
      {/* Search Header */}
      <div className="relative flex items-center border-b border-hairline/80 px-2.5 pb-2">
        <SearchIcon className="size-3.5 text-ink-3 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mention task, teammate, or doc..."
          className="ml-2 w-full bg-transparent text-xs text-ink placeholder:text-ink-3 outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="p-0.5 text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <XIcon className="size-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="p-0.5 text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-1 pt-1.5 pb-1">
        {(
          [
            ["all", "All"],
            ["task", "Tasks"],
            ["member", "People"],
            ["doc", "Docs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
              tab === id
                ? "bg-ink text-ink-inverse font-semibold"
                : "text-ink-3 hover:bg-hover hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="max-h-60 overflow-y-auto divide-y divide-hairline/40 py-1">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-3">
            No matching tasks, teammates, or docs.
          </div>
        ) : (
          items.map((item, index) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors cursor-pointer rounded-xl",
                index === selectedIndex ? "bg-hover text-ink" : "text-ink-2",
              )}
            >
              {item.type === "task" ? (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface-subtle border border-hairline">
                  <StatusGlyph
                    status={(item.status as any) ?? "todo"}
                    size={12}
                  />
                </div>
              ) : item.type === "member" ? (
                <div className="shrink-0">
                  <ActorAvatar name={item.avatar ?? item.title} size={24} />
                </div>
              ) : (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-tint-docs text-ink">
                  <FileTextIcon className="size-3" />
                </div>
              )}

              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-medium text-ink">
                  {item.title}
                </span>
                <span className="truncate text-[10px] text-ink-3">
                  {item.subtitle}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
