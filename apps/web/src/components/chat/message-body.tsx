import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

// Mentions are stored as <@memberId>, <!channel> and <!here>; everything else
// is plain text with a little formatting: **bold**, _italic_, `code`, links
// and task keys like ZEN-18.
const token =
  /(<@[0-9a-f-]{36}>|<!(?:channel|here)>|`[^`\n]+`|\*\*[^*\n]+\*\*|_[^_\n]+_|https?:\/\/[^\s<]+|\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b)/g;

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

/** A message body as inline content, with mentions and task keys resolved. */
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

  const lines = body.split("\n");

  return (
    <span className={cn("break-words whitespace-pre-wrap", className)}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {line.split(token).map((part, index) => {
            const key = `${lineIndex}-${index}`;

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

            if (
              part.startsWith("**") &&
              part.endsWith("**") &&
              part.length > 4
            ) {
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

            return <span key={key}>{marked(part, key)}</span>;
          })}
        </span>
      ))}
    </span>
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

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
