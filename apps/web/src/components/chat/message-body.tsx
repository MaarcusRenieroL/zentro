"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  LightbulbIcon,
  StarIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

import { builtinShortcodes, useCustomEmoji } from "./custom-emoji";

// Mentions are stored as <@memberId>, <!channel> and <!here>; everything else
// is plain text with a little formatting: **bold**, _italic_, `code`, links,
// task keys like ZEN-18 and :emoji:. Block syntax: ``` fences, "> " quotes
// (and "> [!note]" callouts), "- " lists and | tables |.
const token =
  /(<@[0-9a-f-]{36}>|<!(?:channel|here)>|`[^`\n]+`|\*\*[^*\n]+\*\*|_[^_\n]+_|https?:\/\/[^\s<]+|\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b|:[a-z0-9_+-]{2,32}:)/g;

export function MentionChip({
  children,
  me = false,
}: {
  children: ReactNode;
  me?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-xs px-0.5 font-medium",
        me ? "bg-signal-subtle text-signal-strong" : "text-signal-strong",
      )}
    >
      {children}
    </span>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="group/code my-1.5 overflow-hidden rounded-lg border border-hairline bg-sunken">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-1 font-mono text-[11px] text-ink-3">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="flex items-center gap-1 rounded-xs outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Copy code"
        >
          {copied ? (
            <CheckIcon className="size-3" aria-hidden="true" />
          ) : (
            <CopyIcon className="size-3" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2 font-mono text-[13px] leading-5 whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

const callouts = {
  note: {
    label: "Note",
    icon: InfoIcon,
    tone: "border-signal bg-signal-subtle/50",
  },
  tip: {
    label: "Tip",
    icon: LightbulbIcon,
    tone: "border-success bg-success-subtle/50",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangleIcon,
    tone: "border-warning bg-warning-subtle/50",
  },
  important: {
    label: "Important",
    icon: StarIcon,
    tone: "border-danger bg-danger-subtle/40",
  },
} as const;

type Block =
  | { type: "code"; lang: string; code: string }
  | { type: "quote"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "text"; lines: string[] };

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isSeparator = (line: string) => /^\s*\|[\s:|-]+\|\s*$/.test(line);
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];

  for (const part of body.split(/(```[\s\S]*?```)/g)) {
    if (!part) continue;

    if (part.startsWith("```") && part.endsWith("```") && part.length >= 6) {
      const inner = part.slice(3, -3).replace(/^\n/, "");
      const firstBreak = inner.indexOf("\n");
      const first = firstBreak === -1 ? "" : inner.slice(0, firstBreak);
      const hasLang = /^[a-z0-9+#.-]{1,20}$/i.test(first.trim());

      blocks.push({
        type: "code",
        lang: hasLang ? first.trim() : "",
        code: (hasLang ? inner.slice(firstBreak + 1) : inner).replace(
          /\n$/,
          "",
        ),
      });
      continue;
    }

    const lines = part.split("\n");
    let index = 0;

    while (index < lines.length) {
      const line = lines[index]!;

      if (/^>\s?/.test(line)) {
        const quote: string[] = [];

        while (index < lines.length && /^>\s?/.test(lines[index]!)) {
          quote.push(lines[index]!.replace(/^>\s?/, ""));
          index += 1;
        }

        blocks.push({ type: "quote", lines: quote });
      } else if (/^\s*([-*]|\d+\.)\s+\S/.test(line)) {
        const ordered = /^\s*\d+\./.test(line);
        const items: string[] = [];

        while (
          index < lines.length &&
          /^\s*([-*]|\d+\.)\s+\S/.test(lines[index]!) &&
          /^\s*\d+\./.test(lines[index]!) === ordered
        ) {
          items.push(lines[index]!.replace(/^\s*([-*]|\d+\.)\s+/, ""));
          index += 1;
        }

        blocks.push({ type: "list", ordered, items });
      } else if (
        isTableRow(line) &&
        index + 1 < lines.length &&
        isSeparator(lines[index + 1]!)
      ) {
        const head = cells(line);
        const rows: string[][] = [];

        index += 2;

        while (index < lines.length && isTableRow(lines[index]!)) {
          rows.push(cells(lines[index]!));
          index += 1;
        }

        blocks.push({ type: "table", head, rows });
      } else {
        const last = blocks.at(-1);

        if (last?.type === "text") {
          last.lines.push(line);
        } else {
          blocks.push({ type: "text", lines: [line] });
        }

        index += 1;
      }
    }
  }

  return blocks;
}

/** A message body, with mentions, task keys, emoji and a little structure. */
export function MessageBody({
  body,
  names,
  meId,
  taskKeys,
  highlight,
  className,
}: {
  body: string;
  names: Record<string, string>;
  meId?: string;
  /** Keys that are real tasks; other key-looking words stay plain text. */
  taskKeys?: ReadonlySet<string>;
  /** Words to mark, for search results. */
  highlight?: string[];
  className?: string;
}) {
  const { emoji: custom } = useCustomEmoji();

  const marked = (text: string, base: string): ReactNode => {
    if (!highlight?.length) return text;

    const words = highlight
      .filter(Boolean)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (!words.length) return text;

    return text
      .split(new RegExp(`(${words.join("|")})`, "ig"))
      .map((part, i) =>
        i % 2 ? (
          <mark
            key={`${base}-${i}`}
            className="rounded-xs bg-tint-sun px-0.5 text-ink"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
  };

  const inline = (line: string, prefix: string): ReactNode[] =>
    line.split(token).map((part, index) => {
      const key = `${prefix}-${index}`;

      if (!part) return null;

      const mention = /^<@([0-9a-f-]{36})>$/.exec(part);

      if (mention) {
        const id = mention[1]!;

        return (
          <MentionChip key={key} me={id === meId}>
            @{names[id] ?? "someone"}
          </MentionChip>
        );
      }

      if (part === "<!channel>" || part === "<!here>") {
        return (
          <MentionChip key={key} me>
            @{part.slice(2, -1)}
          </MentionChip>
        );
      }

      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={key}
            className="rounded-xs bg-sunken px-1 py-px font-mono text-[0.9em]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }

      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={key}
            href={part}
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal-strong underline-offset-2 hover:underline"
          >
            {part}
          </a>
        );
      }

      if (
        /^[A-Z][A-Z0-9]{1,9}-\d{1,6}$/.test(part) &&
        (!taskKeys || taskKeys.has(part))
      ) {
        return (
          <Link
            key={key}
            href={paths.task(part)}
            className="font-mono text-[0.92em] text-signal-strong hover:underline"
          >
            {part}
          </Link>
        );
      }

      const shortcode = /^:([a-z0-9_+-]{2,32}):$/.exec(part);

      if (shortcode) {
        const name = shortcode[1]!;
        const url = custom.get(name);

        if (url) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={key}
              src={url}
              alt={`:${name}:`}
              title={`:${name}:`}
              className="mx-px inline-block size-5 align-text-bottom"
            />
          );
        }

        if (builtinShortcodes[name]) {
          return <span key={key}>{builtinShortcodes[name]}</span>;
        }
      }

      return <span key={key}>{marked(part, key)}</span>;
    });

  const lines = (rows: string[], prefix: string) =>
    rows.map((row, lineIndex) => (
      <span key={`${prefix}-${lineIndex}`}>
        {lineIndex > 0 ? <br /> : null}
        {inline(row, `${prefix}-${lineIndex}`)}
      </span>
    ));

  const blocks = parseBlocks(body);
  // Plain text stays inline so it can sit in a paragraph or a button.
  const Wrapper = blocks.every((block) => block.type === "text")
    ? "span"
    : "div";

  return (
    <Wrapper className={cn("break-words whitespace-pre-wrap", className)}>
      {blocks.map((block, blockIndex) => {
        const key = `b${blockIndex}`;

        if (block.type === "code") {
          return <CodeBlock key={key} lang={block.lang} code={block.code} />;
        }

        if (block.type === "quote") {
          const first = /^\[!(note|tip|warning|important)\]\s*(.*)$/i.exec(
            block.lines[0] ?? "",
          );

          if (first) {
            const kind =
              callouts[first[1]!.toLowerCase() as keyof typeof callouts];
            const Icon = kind.icon;
            const rest = [first[2] ?? "", ...block.lines.slice(1)].filter(
              (line, i) => i > 0 || line,
            );

            return (
              <div
                key={key}
                className={cn(
                  "my-1.5 flex gap-2.5 rounded-lg border-l-[3px] px-3 py-2 whitespace-normal",
                  kind.tone,
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{kind.label}</p>
                  <div className="text-[15px] leading-6">
                    {lines(rest, key)}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <blockquote
              key={key}
              className="my-1 border-l-2 border-line-strong pl-3 text-ink-2 whitespace-normal"
            >
              {lines(block.lines, key)}
            </blockquote>
          );
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";

          return (
            <Tag
              key={key}
              className={cn(
                "my-1 space-y-0.5 pl-5 whitespace-normal",
                block.ordered ? "list-decimal" : "list-disc",
              )}
            >
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
              ))}
            </Tag>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={key}
              className="my-1.5 max-w-full overflow-x-auto whitespace-normal"
            >
              <table className="border-collapse text-sm">
                <thead>
                  <tr>
                    {block.head.map((cell, i) => (
                      <th
                        key={i}
                        className="border border-hairline bg-sunken px-2.5 py-1 text-left font-semibold"
                      >
                        {inline(cell, `${key}-h${i}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, i) => (
                        <td
                          key={i}
                          className="border border-hairline px-2.5 py-1"
                        >
                          {inline(cell, `${key}-${r}-${i}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return <span key={key}>{lines(block.lines, key)}</span>;
      })}
    </Wrapper>
  );
}

/** "09:24" for today, "Yesterday 09:24", or "Oct 12 09:24". */
export function messageTime(value: Date | string) {
  const date = new Date(value);

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function dayHeading(value: Date | string, now = new Date()) {
  const date = new Date(value);
  const start = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(now) - start(date)) / 86_400_000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function relativeAgo(value: Date | string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h ago`;

  return dayHeading(value);
}

/** "in 20 min", "in 3h", "Tomorrow 09:00": when something is due. */
export function untilLabel(value: Date | string) {
  const date = new Date(value);
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000);

  if (minutes <= 0) return "due now";
  if (minutes < 60) return `in ${minutes} min`;
  if (minutes < 24 * 60) return `in ${Math.round(minutes / 60)}h`;

  return `${dayHeading(date)} ${messageTime(date)}`;
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
