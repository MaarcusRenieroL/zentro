"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowUpIcon,
  AtSignIcon,
  BoldIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  ClockIcon,
  CodeIcon,
  FileIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HashIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  PaperclipIcon,
  SlashIcon,
  SmileIcon,
  XIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

import { ActorAvatar } from "~/src/components/actor-avatar";

import { builtinShortcodes, useCustomEmoji } from "./custom-emoji";
import { fileSize } from "./message-body";

export type Person = {
  memberId: string;
  name: string;
  email: string;
  isMe?: boolean;
  presence?: "active" | "away" | "offline";
};

export type Draft = { body: string; fileIds: string[] };

/** A `/command` in the message box. */
export type SlashCommand = {
  name: string;
  usage: string;
  description: string;
  /** Runs with the text after the command, mentions as <@id>. */
  run: (args: string) => Promise<void> | void;
};

type Pending = {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  id?: string;
  error?: string;
  previewUrl?: string;
};

type Trigger = {
  kind: "mention" | "link" | "emoji";
  query: string;
  start: number;
};

type LinkResult = {
  kind: "task" | "doc" | "project";
  label: string;
  hint: string;
  insert: string;
};

type Option =
  | { kind: "person"; person: Person }
  | { kind: "group"; id: string; note: string }
  | { kind: "link"; result: LinkResult }
  | { kind: "emoji"; name: string; glyph?: string; url?: string }
  | { kind: "command"; command: SlashCommand };

const emoji = [
  "👍",
  "👀",
  "✅",
  "🎉",
  "🙏",
  "😄",
  "🤔",
  "🔥",
  "❤️",
  "🚀",
  "😅",
  "👏",
];

/** Uploads one file with progress, answering with its stored id. */
function upload(file: File, onProgress: (value: number) => void) {
  return new Promise<{ id: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const form = new FormData();

    form.append("file", file);
    request.open("POST", "/api/files");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      try {
        const data = JSON.parse(request.responseText) as {
          id?: string;
          error?: string;
        };

        if (request.status >= 200 && request.status < 300 && data.id) {
          resolve({ id: data.id });
        } else {
          reject(new Error(data.error ?? "Could not upload the file."));
        }
      } catch {
        reject(new Error("Could not upload the file."));
      }
    };
    request.onerror = () => reject(new Error("The upload was interrupted."));
    request.send(form);
  });
}

const laterChoices: Array<[string, () => Date]> = [
  ["In 30 minutes", () => new Date(Date.now() + 30 * 60_000)],
  ["In 1 hour", () => new Date(Date.now() + 60 * 60_000)],
  [
    "Tomorrow at 9:00",
    () => {
      const date = new Date();

      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);

      return date;
    },
  ],
  [
    "Monday at 9:00",
    () => {
      const date = new Date();

      date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7));
      date.setHours(9, 0, 0, 0);

      return date;
    },
  ],
];

/** Local "YYYY-MM-DDTHH:mm" for a datetime-local input. */
function localInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The message box: formatting, @mentions, #links, emoji, commands, files. */
export function Composer({
  placeholder,
  people,
  canAttach = true,
  disabled = false,
  disabledNote,
  offline = false,
  onSend,
  autoFocus = false,
  compact = false,
  onTyped,
  commands = [],
  draftScope,
  onSchedule,
  onManageEmoji,
}: {
  placeholder: string;
  people: Person[];
  canAttach?: boolean;
  disabled?: boolean;
  disabledNote?: string;
  offline?: boolean;
  onSend: (draft: Draft) => Promise<void> | void;
  autoFocus?: boolean;
  compact?: boolean;
  onTyped?: () => void;
  commands?: SlashCommand[];
  /** Saves what is typed here, per conversation or thread. */
  draftScope?: { channelId: string; key: string };
  onSchedule?: (draft: Draft, at: Date) => Promise<void> | void;
  onManageEmoji?: () => void;
}) {
  const trpc = useTrpcClient();
  const custom = useCustomEmoji();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [links, setLinks] = useState<LinkResult[]>([]);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [later, setLater] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Names chosen from the popover, to turn "@Priya" back into a mention.
  const chosen = useRef(new Map<string, string>());
  const draftKey = draftScope?.key;
  const restored = useRef<string | null>(null);
  // Set once the saved draft has been read, so an empty box never overwrites it.
  const loaded = useRef<string | null>(null);

  // A leading "/word" is a command being typed.
  const slashQuery = /^\/([a-z]*)$/.exec(text)?.[1];

  const options = useMemo<Option[]>(() => {
    if (slashQuery !== undefined && commands.length) {
      return commands
        .filter((command) => command.name.startsWith(slashQuery))
        .map((command) => ({ kind: "command" as const, command }));
    }

    if (!trigger) return [];

    const needle = trigger.query.toLowerCase();

    if (trigger.kind === "mention") {
      const matches = people
        .filter((person) => !person.isMe || needle)
        .filter(
          (person) =>
            !needle ||
            person.name.toLowerCase().includes(needle) ||
            person.email.toLowerCase().startsWith(needle),
        )
        .slice(0, 5)
        .map((person) => ({ kind: "person" as const, person }));
      const groups = [
        { kind: "group" as const, id: "channel", note: "Everyone here" },
        { kind: "group" as const, id: "here", note: "People who are active" },
      ].filter((group) => !needle || group.id.startsWith(needle));

      return [...matches, ...groups];
    }

    if (trigger.kind === "link") {
      return links.map((result) => ({ kind: "link" as const, result }));
    }

    const fromCustom = custom.list
      .filter((entry) => entry.name.includes(needle))
      .slice(0, 5)
      .map((entry) => ({
        kind: "emoji" as const,
        name: entry.name,
        url: entry.url,
      }));
    const fromBuiltin = Object.entries(builtinShortcodes)
      .filter(([name]) => name.includes(needle))
      .slice(0, 5)
      .map(([name, glyph]) => ({ kind: "emoji" as const, name, glyph }));

    return [...fromCustom, ...fromBuiltin].slice(0, 7);
  }, [slashQuery, commands, trigger, people, links, custom.list]);

  useEffect(() => {
    if (autoFocus) area.current?.focus();
  }, [autoFocus]);

  // Grow with the text, up to a point.
  useEffect(() => {
    const element = area.current;

    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, compact ? 140 : 220)}px`;
  }, [text, compact]);

  // Look up tasks, docs and projects for a "#" link.
  useEffect(() => {
    if (trigger?.kind !== "link") {
      setLinks([]);

      return;
    }

    let live = true;
    const timer = setTimeout(() => {
      trpc.chat.linkSearch
        .query({ q: trigger.query })
        .then((data) => {
          if (!live) return;

          setLinks([
            ...data.tasks.map((task) => ({
              kind: "task" as const,
              label: task.name,
              hint: task.key,
              insert: task.key,
            })),
            ...data.docs.map((doc) => ({
              kind: "doc" as const,
              label: doc.title,
              hint: "Doc",
              insert: `${window.location.origin}/docs/${doc.slug}`,
            })),
            ...data.projects.map((project) => ({
              kind: "project" as const,
              label: project.name,
              hint: "Project",
              insert: `${window.location.origin}/projects/${project.slug}`,
            })),
          ]);
          setIndex(0);
        })
        .catch(() => undefined);
    }, 150);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [trigger, trpc]);

  // Turn "<@id>" back into "@Name" for editing a saved draft.
  const fromBody = useCallback(
    (body: string) =>
      body.replace(/<@([0-9a-f-]{36})>/g, (whole, id: string) => {
        const person = people.find((entry) => entry.memberId === id);

        if (!person) return whole;

        chosen.current.set(person.name, id);

        return `@${person.name}`;
      }),
    [people],
  );

  // Bring back an unsent draft once, when people are known.
  useEffect(() => {
    if (!draftKey || !draftScope || restored.current === draftKey) return;
    if (!people.length) return;

    restored.current = draftKey;

    let live = true;

    trpc.chat.draftGet
      .query({ scope: draftKey })
      .then((data) => {
        if (live && data.body)
          setText((current) => current || fromBody(data.body));
      })
      .catch(() => undefined)
      .finally(() => {
        loaded.current = draftKey;
      });

    return () => {
      live = false;
    };
  }, [draftKey, draftScope, people.length, trpc, fromBody]);

  const reading = pending.some((file) => !file.id && !file.error);
  const ready = pending.filter((file) => file.id);
  const empty = !text.trim() && !ready.length;

  const toBody = useCallback((value: string) => {
    let body = value.trim();

    // Longest names first so "Ana Maria" wins over "Ana".
    for (const [name, id] of [...chosen.current].sort(
      (a, b) => b[0].length - a[0].length,
    )) {
      body = body.split(`@${name}`).join(`<@${id}>`);
    }

    return body.replace(/@(channel|here)\b/g, "<!$1>");
  }, []);

  // Save the draft shortly after typing stops, and only when it changed.
  const draftChannel = draftScope?.channelId;
  const lastSaved = useRef("");

  useEffect(() => {
    if (!draftChannel || !draftKey || loaded.current !== draftKey) return;

    const body = toBody(text);

    if (body === lastSaved.current) return;

    const timer = setTimeout(() => {
      lastSaved.current = body;
      void trpc.chat.draftSet
        .mutate({ channelId: draftChannel, scope: draftKey, body })
        .catch(() => undefined);
    }, 900);

    return () => clearTimeout(timer);
  }, [text, draftChannel, draftKey, trpc, toBody]);

  const addFiles = useCallback((list: FileList | File[]) => {
    for (const file of Array.from(list)) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      setPending((current) => [
        ...current,
        {
          key,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          progress: 0,
          previewUrl,
        },
      ]);
      upload(file, (progress) =>
        setPending((current) =>
          current.map((item) =>
            item.key === key ? { ...item, progress } : item,
          ),
        ),
      )
        .then(({ id }) =>
          setPending((current) =>
            current.map((item) =>
              item.key === key ? { ...item, id, progress: 1 } : item,
            ),
          ),
        )
        .catch((error: Error) => {
          setPending((current) =>
            current.map((item) =>
              item.key === key ? { ...item, error: error.message } : item,
            ),
          );
          toastError("Upload failed", error.message);
        });
    }
  }, []);

  const insert = (before: string, after = "", fallback = "") => {
    const element = area.current;

    if (!element) return;

    const { selectionStart: start, selectionEnd: end } = element;
    const selected = text.slice(start, end) || fallback;
    const next =
      text.slice(0, start) + before + selected + after + text.slice(end);

    setText(next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };

  const detectTrigger = (value: string, caret: number) => {
    const upToCaret = value.slice(0, caret);
    const mention = /(?:^|\s)@([\w.-]{0,30})$/.exec(upToCaret);
    const link = /(?:^|\s)#([\w-]{0,30})$/.exec(upToCaret);
    const shortcode = /(?:^|\s):([a-z0-9_+-]{2,20})$/.exec(upToCaret);

    if (mention) {
      setTrigger({
        kind: "mention",
        query: mention[1] ?? "",
        start: caret - (mention[1]?.length ?? 0) - 1,
      });
    } else if (link) {
      setTrigger({
        kind: "link",
        query: link[1] ?? "",
        start: caret - (link[1]?.length ?? 0) - 1,
      });
    } else if (shortcode) {
      setTrigger({
        kind: "emoji",
        query: shortcode[1] ?? "",
        start: caret - (shortcode[1]?.length ?? 0) - 1,
      });
    } else {
      setTrigger(null);
    }

    setIndex(0);
  };

  const pick = (option: Option) => {
    if (option.kind === "command") {
      setText(`/${option.command.name} `);
      requestAnimationFrame(() => area.current?.focus());

      return;
    }

    if (!trigger || !area.current) return;

    const caret = area.current.selectionStart;
    let replacement = "";

    if (option.kind === "person") {
      chosen.current.set(option.person.name, option.person.memberId);
      replacement = `@${option.person.name} `;
    } else if (option.kind === "group") {
      replacement = `@${option.id} `;
    } else if (option.kind === "link") {
      replacement = `${option.result.insert} `;
    } else {
      replacement = option.url ? `:${option.name}: ` : `${option.glyph} `;
    }

    const next = `${text.slice(0, trigger.start)}${replacement}${text.slice(caret)}`;

    setText(next);
    setTrigger(null);
    requestAnimationFrame(() => {
      const position = trigger.start + replacement.length;

      area.current?.focus();
      area.current?.setSelectionRange(position, position);
    });
  };

  const send = async () => {
    if (empty || reading || disabled) return;

    const body = toBody(text);
    const command = /^\/([a-z]+)(?:\s+([\s\S]*))?$/.exec(body);
    const match = command
      ? commands.find((entry) => entry.name === command[1])
      : undefined;

    if (match) {
      setText("");
      setTrigger(null);
      chosen.current.clear();

      try {
        await match.run((command![2] ?? "").trim());
      } catch (error) {
        toastError(error, `Could not run /${match.name}`);
        setText(text);
      }

      area.current?.focus();

      return;
    }

    const draft = { body, fileIds: ready.map((file) => file.id!) };

    setText("");
    setPending([]);
    setTrigger(null);
    chosen.current.clear();

    if (draftScope) {
      lastSaved.current = "";
      void trpc.chat.draftSet
        .mutate({
          channelId: draftScope.channelId,
          scope: draftScope.key,
          body: "",
        })
        .catch(() => undefined);
    }

    await onSend(draft);
    area.current?.focus();
  };

  const sendLater = async (at: Date) => {
    if (empty || reading || disabled || !onSchedule) return;

    const draft = {
      body: toBody(text),
      fileIds: ready.map((file) => file.id!),
    };

    if (!draft.body) {
      toastError("Write a message to schedule.", "Nothing to schedule");

      return;
    }

    setLater(false);
    setText("");
    setPending([]);
    chosen.current.clear();
    await onSchedule(draft, at);
    area.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (options.length && (trigger || slashQuery !== undefined)) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setIndex(
          (current) =>
            (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
            options.length,
        );

        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        // A fully typed command with nothing to complete just runs.
        const selected = options[index]!;

        if (
          !(
            selected.kind === "command" &&
            event.key === "Enter" &&
            slashQuery === selected.command.name
          )
        ) {
          event.preventDefault();
          pick(selected);

          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setTrigger(null);

        return;
      }
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void send();
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    const pasted = Array.from(event.clipboardData.files);

    if (pasted.length && canAttach) {
      event.preventDefault();
      addFiles(pasted);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);

    if (canAttach && event.dataTransfer.files.length) {
      addFiles(event.dataTransfer.files);
    }
  };

  if (disabled && disabledNote) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-4 py-3 text-center text-sm text-ink-2">
        {disabledNote}
      </div>
    );
  }

  const tool =
    "size-8 rounded-sm text-ink-2 hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring";
  const showPopup = options.length > 0 && (trigger || slashQuery !== undefined);
  const heading =
    slashQuery !== undefined
      ? "Commands"
      : trigger?.kind === "link"
        ? "Link a task, doc or project"
        : trigger?.kind === "emoji"
          ? "Emoji"
          : "People";

  return (
    <div
      onDragOver={(event) => {
        if (canAttach) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative rounded-xl border bg-surface transition-colors focus-within:border-signal focus-within:ring-4 focus-within:ring-ring/20",
        dragging ? "border-signal bg-signal-subtle" : "border-hairline",
      )}
    >
      {showPopup ? (
        <div
          role="listbox"
          aria-label={heading}
          className="absolute bottom-full left-0 z-20 mb-2 w-80 max-w-full rounded-lg border border-hairline bg-popover p-1.5 shadow-lg"
        >
          <p className="eyebrow px-2 pt-1 pb-1.5">{heading}</p>
          {options.map((option, optionIndex) => {
            const selected = optionIndex === index;
            const key =
              option.kind === "person"
                ? option.person.memberId
                : option.kind === "group"
                  ? `g-${option.id}`
                  : option.kind === "link"
                    ? `l-${option.result.kind}-${option.result.insert}`
                    : option.kind === "emoji"
                      ? `e-${option.name}`
                      : `c-${option.command.name}`;

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(option);
                }}
                onMouseEnter={() => setIndex(optionIndex)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
                  selected && "bg-hover",
                )}
              >
                {option.kind === "person" ? (
                  <>
                    <ActorAvatar name={option.person.name} size={22} />
                    <span className="flex-1 truncate">
                      {option.person.name}
                    </span>
                    <span className="truncate font-mono text-[11px] text-ink-3">
                      {option.person.email.split("@")[0]}
                    </span>
                  </>
                ) : option.kind === "group" ? (
                  <>
                    <AtSignIcon
                      className="size-4 text-ink-3"
                      aria-hidden="true"
                    />
                    <span className="font-mono">@{option.id}</span>
                    <span className="flex-1 truncate text-right text-xs text-ink-3">
                      {option.note}
                    </span>
                  </>
                ) : option.kind === "link" ? (
                  <>
                    {option.result.kind === "task" ? (
                      <CheckSquareIcon
                        className="size-4 text-ink-3"
                        aria-hidden="true"
                      />
                    ) : option.result.kind === "doc" ? (
                      <FileTextIcon
                        className="size-4 text-ink-3"
                        aria-hidden="true"
                      />
                    ) : (
                      <FolderKanbanIcon
                        className="size-4 text-ink-3"
                        aria-hidden="true"
                      />
                    )}
                    <span className="flex-1 truncate">
                      {option.result.label}
                    </span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {option.result.hint}
                    </span>
                  </>
                ) : option.kind === "emoji" ? (
                  <>
                    {option.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={option.url} alt="" className="size-5" />
                    ) : (
                      <span className="w-5 text-center text-base">
                        {option.glyph}
                      </span>
                    )}
                    <span className="font-mono text-[13px]">
                      :{option.name}:
                    </span>
                  </>
                ) : (
                  <>
                    <SlashIcon
                      className="size-4 text-ink-3"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[13px]">
                        /{option.command.name}{" "}
                        <span className="text-ink-3">
                          {option.command.usage}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {option.command.description}
                      </span>
                    </span>
                  </>
                )}
              </button>
            );
          })}
          <p className="px-2 pt-1.5 pb-0.5 font-mono text-[10px] text-ink-3">
            ↑↓ move · ↵ insert · Esc close
          </p>
        </div>
      ) : null}

      {pending.length ? (
        <ul className="flex flex-wrap gap-2 px-3 pt-3">
          {pending.map((file) => (
            <li
              key={file.key}
              className={cn(
                "relative flex w-56 items-center gap-2.5 rounded-lg border bg-canvas p-2",
                file.error ? "border-danger" : "border-hairline",
              )}
            >
              {file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.previewUrl}
                  alt=""
                  className="size-10 rounded-sm object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-sm bg-tint-docs">
                  <FileIcon className="size-4" aria-hidden="true" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  {file.name}
                </span>
                <span
                  className={cn(
                    "block font-mono text-[11px]",
                    file.error ? "text-danger-text" : "text-ink-3",
                  )}
                >
                  {file.error
                    ? file.error
                    : file.id
                      ? `${fileSize(file.size)} · ready`
                      : `${Math.round(file.progress * 100)}% of ${fileSize(file.size)}`}
                </span>
                {!file.id && !file.error ? (
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-sunken">
                    <span
                      className="block h-full rounded-full bg-signal transition-[width]"
                      style={{ width: `${file.progress * 100}%` }}
                    />
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setPending((current) =>
                    current.filter((item) => item.key !== file.key),
                  )
                }
                className="rounded-xs p-0.5 text-ink-3 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <textarea
        ref={area}
        value={text}
        rows={1}
        placeholder={
          offline ? `${placeholder} · sends when you reconnect` : placeholder
        }
        aria-label={placeholder}
        onChange={(event) => {
          setText(event.target.value);
          detectTrigger(event.target.value, event.target.selectionStart);
          onTyped?.();
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => setTimeout(() => setTrigger(null), 120)}
        className="block max-h-56 w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-6 outline-none placeholder:text-ink-3"
      />

      <div className="flex items-center gap-0.5 px-2 pb-2">
        {canAttach ? (
          <>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="sr-only"
              aria-label="Attach files"
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={tool}
              aria-label="Attach a file"
              onClick={() => fileInput.current?.click()}
            >
              <PaperclipIcon className="size-4" />
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
          aria-label="Mention someone"
          onClick={() => insert("@")}
        >
          <AtSignIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
          aria-label="Link a task, doc or project"
          onClick={() => insert("#")}
        >
          <HashIcon className="size-4" />
        </Button>
        <span
          aria-hidden="true"
          className="mx-1 hidden h-4 w-px bg-hairline sm:block"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(tool, "hidden sm:inline-flex")}
          aria-label="Bold"
          onClick={() => insert("**", "**", "bold")}
        >
          <BoldIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(tool, "hidden sm:inline-flex")}
          aria-label="Italic"
          onClick={() => insert("_", "_", "italic")}
        >
          <ItalicIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(tool, "hidden sm:inline-flex")}
          aria-label="Code"
          onClick={() =>
            text.includes("\n")
              ? insert("```\n", "\n```", "code")
              : insert("`", "`", "code")
          }
        >
          <CodeIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(tool, "hidden sm:inline-flex")}
          aria-label="List"
          onClick={() => insert("\n- ", "", "item")}
        >
          <ListIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(tool, "hidden sm:inline-flex")}
          aria-label="Link"
          onClick={() => insert("", " https://")}
        >
          <LinkIcon className="size-4" />
        </Button>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-hairline" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={tool}
              aria-label="Add an emoji"
            >
              <SmileIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="flex w-60 flex-col gap-2 p-2"
          >
            <div className="grid grid-cols-6 gap-1">
              {emoji.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => insert(item)}
                  className="rounded-sm p-1 text-lg hover:bg-hover"
                >
                  {item}
                </button>
              ))}
            </div>
            {custom.list.length ? (
              <div className="grid grid-cols-6 gap-1 border-t border-hairline pt-2">
                {custom.list.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    title={`:${item.name}:`}
                    onClick={() => insert(`:${item.name}: `)}
                    className="flex items-center justify-center rounded-sm p-1 hover:bg-hover"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.name} className="size-5" />
                  </button>
                ))}
              </div>
            ) : null}
            {onManageEmoji ? (
              <button
                type="button"
                onClick={onManageEmoji}
                className="rounded-sm px-1 py-1 text-left text-xs text-signal-strong hover:bg-hover"
              >
                Add or remove custom emoji…
              </button>
            ) : null}
          </PopoverContent>
        </Popover>

        <span className="flex-1" />
        {compact ? null : (
          <span className="mr-2 hidden font-mono text-[11px] whitespace-nowrap text-ink-3 sm:block">
            ↵ send · ⇧↵ new line
          </span>
        )}
        <div className="flex items-center">
          <Button
            type="button"
            size="icon-sm"
            aria-label="Send message"
            disabled={empty || reading}
            onClick={() => void send()}
            className={cn(
              "size-8",
              onSchedule ? "rounded-r-none" : "rounded-md",
            )}
          >
            {reading ? (
              <ImageIcon className="size-4 animate-pulse" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </Button>
          {onSchedule ? (
            <Popover open={later} onOpenChange={setLater}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label="Send later"
                  disabled={empty || reading}
                  className="h-8 w-6 rounded-l-none border-l border-on-signal/30"
                >
                  <ChevronDownIcon className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 gap-1 p-2">
                <p className="flex items-center gap-1.5 px-2 pt-1 pb-1 text-sm font-semibold">
                  <ClockIcon className="size-4" aria-hidden="true" />
                  Send later
                </p>
                {laterChoices.map(([label, at]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => void sendLater(at())}
                    className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover"
                  >
                    {label}
                  </button>
                ))}
                <form
                  className="flex flex-col gap-1.5 border-t border-hairline px-2 pt-2"
                  onSubmit={(event) => {
                    event.preventDefault();

                    const value = new FormData(event.currentTarget).get("at");

                    if (typeof value === "string" && value) {
                      void sendLater(new Date(value));
                    }
                  }}
                >
                  <label className="text-xs text-ink-2" htmlFor="send-at">
                    Pick a time
                  </label>
                  <input
                    id="send-at"
                    name="at"
                    type="datetime-local"
                    min={localInput(new Date(Date.now() + 60_000))}
                    required
                    className="h-8 rounded-md border border-hairline bg-surface px-2 text-sm"
                  />
                  <Button type="submit" size="sm">
                    Schedule
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </div>
    </div>
  );
}
