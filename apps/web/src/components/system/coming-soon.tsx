"use client";

import { useEffect, useState } from "react";
import { CheckIcon, FileIcon, MessageSquareIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { Button } from "@zentro/ui/shadcn/button";

type Kind = "files" | "chat";

const copy: Record<
  Kind,
  { name: string; headline: string; body: string; planned: string }
> = {
  files: {
    name: "Files",
    headline: "Files is on its way.",
    body: "Upload a file once and attach it to any task, doc or project. It joins the Thread like everything else, so you can always see where it’s used.",
    planned: "Planned for early 2027",
  },
  chat: {
    name: "Chat",
    headline: "Chat is on its way.",
    body: "Channels and threads that sit next to the work they’re about. Mention a task key in a message and it links both ways.",
    planned: "Planned for 2027",
  },
};

const storageKey = (kind: Kind) => `zentro:notify:${kind}`;

const files = [
  {
    ext: "HAR",
    name: "session-trace.har",
    key: "ZEN-18",
    linked: "Fix login redirect loop",
    size: "2.1 MB",
    date: "Today",
    tint: "bg-tint-projects",
  },
  {
    ext: "XLS",
    name: "Q4 pricing scenarios.xlsx",
    key: "BIL-4",
    linked: "Proration rules",
    size: "640 KB",
    date: "Oct 13",
    tint: "bg-tint-teams",
  },
  {
    ext: "PDF",
    name: "Onboarding research.pdf",
    key: "ONB",
    linked: "Onboarding Flow",
    size: "8.4 MB",
    date: "Oct 11",
    tint: "bg-tint-docs",
  },
  {
    ext: "PNG",
    name: "Empty state v3.png",
    key: "ONB-14",
    linked: "Empty state for new…",
    size: "1.2 MB",
    date: "Oct 10",
    tint: "bg-tint-tasks",
  },
  {
    ext: "CSV",
    name: "churn-sept.csv",
    key: "BIL",
    linked: "Billing Revamp",
    size: "220 KB",
    date: "Oct 2",
    tint: "bg-tint-teams",
  },
];

const channels = [
  "# platform",
  "# billing",
  "# onboarding",
  "# general",
  "Arjun Mehta",
];

const messages = [
  {
    who: "Arjun Mehta",
    time: "10:02",
    body: "Redirect loop is back on staging after the cookie change.",
    link: {
      key: "ZEN-18",
      title: "Fix login redirect loop",
      status: "in-progress",
    },
  },
  {
    who: "Tom Becker",
    time: "10:04",
    body: "I can take it after standup. Is the trace in the task?",
  },
  {
    who: "Arjun Mehta",
    time: "10:05",
    body: "Yes, attached it to the Thread.",
  },
  {
    who: "Priya Raman",
    time: "10:11",
    body: "Let’s ship the fix behind a flag and watch the error rate.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

/**
 * A module that is planned but not built. It says so plainly, offers the one
 * action, and shows a dim, inert preview of what is coming.
 */
export function ComingSoon({ kind, email }: { kind: Kind; email: string }) {
  const { name, headline, body, planned } = copy[kind];
  const Icon = kind === "files" ? FileIcon : MessageSquareIcon;
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    try {
      setNotified(localStorage.getItem(storageKey(kind)) === "1");
    } catch {
      // Storage can be blocked; the button just stays available.
    }
  }, [kind]);

  const notify = () => {
    setNotified(true);

    try {
      localStorage.setItem(storageKey(kind), "1");
    } catch {
      // Not fatal: the confirmation still shows for this visit.
    }
  };

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          {name}
        </h1>
        <span className="rounded-full border border-dashed border-ink-3 px-2.5 py-px font-mono text-[11px] text-ink-2">
          Coming
        </span>
      </div>

      <div className="flex flex-col items-center gap-3.5 pt-14 pb-9 text-center">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl border border-hairline text-ink",
            kind === "files" ? "bg-tint-projects" : "bg-tint-teams",
          )}
        >
          <Icon className="size-[22px]" aria-hidden="true" />
        </span>
        <h2 className="font-serif-italic text-[2.5rem] leading-none sm:text-[3.5rem] sm:leading-[3.75rem]">
          {headline}
        </h2>
        <p className="max-w-[540px] text-base leading-6 text-ink-2">{body}</p>
        {notified ? (
          <p
            className="mt-1.5 flex h-11 items-center gap-2 text-[15px]"
            role="status"
          >
            <span className="flex size-[18px] items-center justify-center rounded-full bg-success text-on-success">
              <CheckIcon
                className="size-3"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            We’ll email {email} when it’s ready.
          </p>
        ) : (
          <Button size="lg" className="mt-1.5" onClick={notify}>
            Notify me
          </Button>
        )}
        <span className="font-mono text-xs text-ink-3">{planned}</span>
      </div>

      <div
        aria-hidden="true"
        inert
        className="pointer-events-none relative opacity-[0.42] [mask-image:linear-gradient(180deg,#000_30%,transparent)]"
      >
        <span className="absolute top-3 right-4 z-10 font-mono text-[11px] tracking-[0.08em] text-ink-2">
          PREVIEW · NOT LIVE
        </span>
        {kind === "files" ? (
          <div className="rounded-xl border border-dashed border-hairline px-3 py-2">
            <div className="flex h-9 items-center gap-3 border-b border-hairline px-2 font-mono text-[11px] tracking-[0.08em] text-ink-3">
              <span className="flex-1">NAME</span>
              <span className="hidden w-[200px] sm:block">LINKED TO</span>
              <span className="w-20 text-right">SIZE</span>
              <span className="hidden w-[90px] text-right sm:block">
                UPDATED
              </span>
            </div>
            {files.map((file) => (
              <div
                key={file.name}
                className="flex h-[52px] items-center gap-3 border-b border-hairline px-2"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      "flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-hairline font-mono text-[9px]",
                      file.tint,
                    )}
                  >
                    {file.ext}
                  </span>
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="hidden w-[200px] items-center gap-1.5 sm:flex">
                  <span className="rounded-xs border border-hairline px-1.5 font-mono text-xs">
                    {file.key}
                  </span>
                  <span className="truncate text-xs text-ink-2">
                    {file.linked}
                  </span>
                </span>
                <span className="w-20 text-right font-mono text-xs text-ink-2">
                  {file.size}
                </span>
                <span className="hidden w-[90px] text-right font-mono text-xs text-ink-2 sm:block">
                  {file.date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[380px] rounded-xl border border-dashed border-hairline sm:grid-cols-[220px_minmax(0,1fr)]">
            <div className="hidden flex-col gap-0.5 border-r border-hairline px-2.5 py-3.5 sm:flex">
              <span className="px-2 pb-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-3">
                CHANNELS
              </span>
              {channels.map((channel, index) => (
                <span
                  key={channel}
                  className={cn(
                    "flex h-8 items-center rounded-md px-2 text-sm",
                    index === 0 && "bg-hover font-medium",
                  )}
                >
                  {channel}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-4 px-5 py-4">
              {messages.map((message) => (
                <div key={message.time} className="flex gap-2.5">
                  <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full border border-hairline bg-tint-tasks font-mono text-[11px]">
                    {initials(message.who)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      <span className="font-semibold">{message.who}</span>{" "}
                      <span className="font-mono text-[11px] text-ink-3">
                        {message.time}
                      </span>
                    </span>
                    <span className="text-sm leading-5">{message.body}</span>
                    {message.link ? (
                      <span className="inline-flex h-[30px] items-center gap-2 self-start rounded-md border border-hairline px-2.5 text-[13px]">
                        <StatusGlyph
                          status={message.link.status}
                          size={12}
                          decorative
                        />
                        <span className="font-mono text-xs">
                          {message.link.key}
                        </span>
                        {message.link.title}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
