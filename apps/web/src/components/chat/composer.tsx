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
  CodeIcon,
  FileIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  PaperclipIcon,
  SmileIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { toastError } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

import { ActorAvatar } from "~/src/components/actor-avatar";

import { fileSize } from "./message-body";

export type Person = {
  memberId: string;
  name: string;
  email: string;
  isMe?: boolean;
  presence?: "active" | "away" | "offline";
};

export type Draft = { body: string; fileIds: string[] };

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

/** The message box: formatting, @mentions, emoji and attachments. */
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
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [mention, setMention] = useState<{
    query: string;
    start: number;
  } | null>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Names chosen from the popover, to turn "@Priya" back into a mention.
  const chosen = useRef(new Map<string, string>());

  const options = useMemo(() => {
    if (!mention) return [];

    const needle = mention.query.toLowerCase();
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
  }, [mention, people]);

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

  const reading = pending.some((file) => !file.id && !file.error);
  const ready = pending.filter((file) => file.id);
  const empty = !text.trim() && !ready.length;

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

  const detectMention = (value: string, caret: number) => {
    const upToCaret = value.slice(0, caret);
    const match = /(?:^|\s)@([\w.-]{0,30})$/.exec(upToCaret);

    setMention(
      match
        ? { query: match[1] ?? "", start: caret - (match[1]?.length ?? 0) - 1 }
        : null,
    );
    setIndex(0);
  };

  const pick = (option: (typeof options)[number]) => {
    if (!mention || !area.current) return;

    const label = option.kind === "person" ? option.person.name : option.id;

    if (option.kind === "person") {
      chosen.current.set(label, option.person.memberId);
    }

    const caret = area.current.selectionStart;
    const next = `${text.slice(0, mention.start)}@${label} ${text.slice(caret)}`;

    setText(next);
    setMention(null);
    requestAnimationFrame(() => {
      const position = mention.start + label.length + 2;

      area.current?.focus();
      area.current?.setSelectionRange(position, position);
    });
  };

  const toBody = () => {
    let body = text.trim();

    // Longest names first so "Ana Maria" wins over "Ana".
    for (const [name, id] of [...chosen.current].sort(
      (a, b) => b[0].length - a[0].length,
    )) {
      body = body.split(`@${name}`).join(`<@${id}>`);
    }

    return body.replace(/@(channel|here)\b/g, "<!$1>");
  };

  const send = async () => {
    if (empty || reading || disabled) return;

    const draft = { body: toBody(), fileIds: ready.map((file) => file.id!) };

    setText("");
    setPending([]);
    setMention(null);
    chosen.current.clear();
    await onSend(draft);
    area.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && options.length) {
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
        event.preventDefault();
        pick(options[index]!);

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMention(null);

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
      {mention && options.length ? (
        <div
          role="listbox"
          aria-label="Mention someone"
          className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-lg border border-hairline bg-popover p-1.5 shadow-lg"
        >
          {options.some((option) => option.kind === "person") ? (
            <p className="eyebrow px-2 pt-1 pb-1.5">People</p>
          ) : null}
          {options.map((option, optionIndex) => {
            const selected = optionIndex === index;

            return (
              <button
                key={
                  option.kind === "person"
                    ? option.person.memberId
                    : `g-${option.id}`
                }
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
                ) : (
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
          detectMention(event.target.value, event.target.selectionStart);
          onTyped?.();
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => setTimeout(() => setMention(null), 120)}
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
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-hairline" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
          aria-label="Bold"
          onClick={() => insert("**", "**", "bold")}
        >
          <BoldIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
          aria-label="Italic"
          onClick={() => insert("_", "_", "italic")}
        >
          <ItalicIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
          aria-label="Code"
          onClick={() => insert("`", "`", "code")}
        >
          <CodeIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
          aria-label="List"
          onClick={() => insert("\n- ", "", "item")}
        >
          <ListIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={tool}
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
            className="grid w-56 grid-cols-6 gap-1 p-2"
          >
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
          </PopoverContent>
        </Popover>

        <span className="flex-1" />
        <span className="mr-2 hidden font-mono text-[11px] text-ink-3 sm:block">
          ↵ send · ⇧↵ new line
        </span>
        <Button
          type="button"
          size="icon-sm"
          aria-label="Send message"
          disabled={empty || reading}
          onClick={() => void send()}
          className="size-8 rounded-md"
        >
          {reading ? (
            <ImageIcon className="size-4 animate-pulse" />
          ) : (
            <ArrowUpIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
