"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import {
  FileTextIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { useTrpcClient } from "@zentro/api/react";
import { applyDensity } from "@zentro/ui/components/appearance";
import { Kbd } from "@zentro/ui/components/kbd";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";
import { formatDueDate } from "@zentro/utils";

import { getModuleIcon } from "~/src/lib/module-icons";
import { paths } from "~/src/lib/paths";

import type { ShellModule } from "./app-sidebar";
import { useRecent, type RecentItem } from "./use-recent";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: ShellModule[];
  actions: Array<{ id: string; label: string; key?: string; run: () => void }>;
};

type TaskHit = {
  key: string;
  name: string;
  project: string;
  status: string;
  due: string | null;
};

type DocHit = { slug: string; title: string; project: string | null };

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-ink-2 outline-none data-[selected=true]:bg-signal-subtle data-[selected=true]:text-ink data-[selected=true]:ring-1 data-[selected=true]:ring-signal/30 [&_svg]:size-4 [&_svg]:text-ink-3";

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase";

/** The go-to shortcuts: `G` then a letter. */
const goKeys: Record<string, string> = {
  dashboard: "H",
  tasks: "T",
  projects: "P",
  docs: "D",
  team: "M",
  settings: ",",
  overview: "O",
};

function Shortcut({ keys }: { keys: string[] }) {
  return (
    <span className="ml-auto flex gap-1">
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  );
}

/** The matching part of a title set in semibold. */
function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;

  if (index < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <strong className="font-semibold text-ink">
        {text.slice(index, index + query.length)}
      </strong>
      {text.slice(index + query.length)}
    </>
  );
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/** Jump anywhere, create something, or flip the theme, from the keyboard. */
export function CommandPalette({
  open,
  onOpenChange,
  modules,
  actions,
}: Props) {
  const router = useRouter();
  const trpc = useTrpcClient();
  const { resolvedTheme, setTheme } = useTheme();
  const recent = useRecent();
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<TaskHit[] | null>(null);
  const [docs, setDocs] = useState<DocHit[]>([]);
  const goPending = useRef<number | null>(null);

  const has = (id: string) => modules.some((item) => item.id === id);
  const trimmed = query.trim();

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const toggleDensity = () =>
    applyDensity(
      document.documentElement.dataset.density === "compact"
        ? "comfortable"
        : "compact",
    );

  // Shortcuts that work anywhere in the app.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "k" && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        if (key === "l") {
          event.preventDefault();
          toggleTheme();
        } else if (key === "d") {
          event.preventDefault();
          toggleDensity();
        }
        return;
      }

      if (open || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      // G then a letter navigates; a lone C, D or P creates.
      if (goPending.current !== null) {
        window.clearTimeout(goPending.current);
        goPending.current = null;

        const target = modules.find(
          (item) => goKeys[item.id]?.toLowerCase() === key,
        );

        if (target) {
          event.preventDefault();
          router.push(target.href);
        }
        return;
      }

      if (key === "g") {
        goPending.current = window.setTimeout(() => {
          goPending.current = null;
        }, 1000);
        return;
      }

      const action = actions.find((item) => item.key?.toLowerCase() === key);

      if (action) {
        event.preventDefault();
        action.run();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modules, actions, resolvedTheme, router]);

  // Tasks load once per opening; docs are searched as you type.
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    if (!has("tasks") || tasks) return;

    void trpc.task.getTasksByOrgId
      .query({})
      .then((rows) =>
        setTasks(
          rows.map((row) => ({
            key: row.key,
            name: row.name,
            project: row.project,
            status: row.status,
            due: row.due ? new Date(row.due).toISOString() : null,
          })),
        ),
      )
      .catch(() => setTasks([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trpc]);

  useEffect(() => {
    if (!open || !has("docs") || trimmed.length < 2) {
      setDocs([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void trpc.docs.search
        .query({ query: trimmed })
        .then((rows) => {
          if (!cancelled) {
            setDocs(
              rows.slice(0, 5).map((row) => ({
                slug: row.slug,
                title: row.title,
                project: row.projectName,
              })),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setDocs([]);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trimmed, trpc]);

  const taskHits = useMemo(() => {
    if (!trimmed || !tasks) return [];

    const needle = trimmed.toLowerCase();

    return tasks
      .filter(
        (task) =>
          task.name.toLowerCase().includes(needle) ||
          task.key.toLowerCase().includes(needle),
      )
      .slice(0, 5);
  }, [tasks, trimmed]);

  const done = (run: () => void) => {
    onOpenChange(false);
    run();
  };

  const go = (href: string) => done(() => router.push(href));
  const searching = trimmed.length > 0;
  const resultCount = taskHits.length + docs.length;

  const group = (heading: string, children: ReactNode) => (
    <Command.Group heading={heading} className={groupClass}>
      {children}
    </Command.Group>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[88px] max-w-[40rem] translate-y-0 gap-0 overflow-hidden rounded-[20px] p-0 sm:max-w-[40rem]"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a place to go or something to create.
        </DialogDescription>
        <Command label="Command palette" loop>
          <div className="flex h-14 items-center gap-3 border-b border-hairline px-4">
            <SearchIcon className="size-4 text-ink-3" aria-hidden="true" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search tasks, docs, or jump to…"
              className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
            />
            <Kbd>esc</Kbd>
          </div>
          <Command.List className="max-h-[26rem] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-ink-2">
              Nothing matches “{trimmed}”.
            </Command.Empty>

            {searching && taskHits.length > 0
              ? group(
                  "Tasks",
                  taskHits.map((task) => {
                    const due = formatDueDate(task.due);

                    return (
                      <Command.Item
                        key={task.key}
                        value={`task ${task.key} ${task.name}`}
                        keywords={[task.name, task.key]}
                        onSelect={() => go(paths.task(task.key))}
                        className={itemClass}
                      >
                        <StatusGlyph
                          status={task.status}
                          size={14}
                          decorative
                        />
                        <span className="font-mono text-xs text-ink-3">
                          {task.key}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          <Highlight text={task.name} query={trimmed} />
                        </span>
                        <span className="truncate text-xs text-ink-3">
                          {task.project}
                          {due.tone !== "none" ? ` · ${due.text}` : ""}
                        </span>
                      </Command.Item>
                    );
                  }),
                )
              : null}

            {searching && docs.length > 0
              ? group(
                  "Docs",
                  docs.map((doc) => (
                    <Command.Item
                      key={doc.slug}
                      value={`doc ${doc.slug} ${doc.title}`}
                      keywords={[doc.title]}
                      onSelect={() => go(paths.doc(doc.slug))}
                      className={itemClass}
                    >
                      <FileTextIcon aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        <Highlight text={doc.title} query={trimmed} />
                      </span>
                      {doc.project ? (
                        <span className="truncate text-xs text-ink-3">
                          {doc.project}
                        </span>
                      ) : null}
                    </Command.Item>
                  )),
                )
              : null}

            {searching && has("docs") ? (
              <Command.Group className={groupClass}>
                <Command.Item
                  value={`search-all ${trimmed}`}
                  onSelect={() => go(paths.searchDocs(trimmed))}
                  className={itemClass}
                >
                  <SearchIcon aria-hidden="true" />
                  Search all docs for “{trimmed}”
                </Command.Item>
              </Command.Group>
            ) : null}

            {!searching && recent.items.length > 0
              ? group(
                  "Recent",
                  recent.items.slice(0, 3).map((item: RecentItem) => (
                    <Command.Item
                      key={item.href}
                      value={`recent ${item.label}`}
                      onSelect={() => go(item.href)}
                      className={itemClass}
                    >
                      <SearchIcon aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    </Command.Item>
                  )),
                )
              : null}

            {group(
              "Go to",
              modules.map((item) => {
                const Icon = getModuleIcon(item.icon);
                const shortcut = goKeys[item.id];

                return (
                  <Command.Item
                    key={item.id}
                    value={`go ${item.label}`}
                    onSelect={() => go(item.href)}
                    className={itemClass}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                    {shortcut ? <Shortcut keys={["G", shortcut]} /> : null}
                  </Command.Item>
                );
              }),
            )}

            {actions.length
              ? group(
                  "Create",
                  actions.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={`create ${action.label}`}
                      onSelect={() => done(action.run)}
                      className={itemClass}
                    >
                      <PlusIcon aria-hidden="true" />
                      {action.label}
                      {action.key ? <Shortcut keys={[action.key]} /> : null}
                    </Command.Item>
                  )),
                )
              : null}

            {group(
              "Appearance",
              <>
                <Command.Item
                  value="appearance toggle theme light dark"
                  onSelect={() => done(toggleTheme)}
                  className={itemClass}
                >
                  {resolvedTheme === "dark" ? (
                    <SunIcon aria-hidden="true" />
                  ) : (
                    <MoonIcon aria-hidden="true" />
                  )}
                  Toggle theme
                  <Shortcut keys={["⇧⌘L"]} />
                </Command.Item>
                <Command.Item
                  value="appearance toggle density compact comfortable"
                  onSelect={() => done(toggleDensity)}
                  className={itemClass}
                >
                  <span aria-hidden="true" className="size-4" />
                  Toggle density
                  <Shortcut keys={["⇧⌘D"]} />
                </Command.Item>
              </>,
            )}
          </Command.List>
          <div
            className={cn(
              "flex items-center gap-3 border-t border-hairline px-4 py-2.5 text-xs text-ink-3",
            )}
          >
            <span className="flex items-center gap-1">
              <Kbd>↑↓</Kbd> move
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> open
            </span>
            <span className="ml-auto font-mono">
              {searching
                ? `${resultCount} result${resultCount === 1 ? "" : "s"}`
                : ""}
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
