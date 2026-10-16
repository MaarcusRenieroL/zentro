"use client";

import { useEffect, useState } from "react";

import { cn } from "@zentro/ui/lib/utils";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { initialsOf } from "@zentro/ui/lib/tone";

// A decorative fragment of the product: one task and everything linked to it
// on a Thread, beside a team pulse that keeps moving. The names are
// illustrative; nothing here is read from an account.
const thread = [
  { kind: "PROJECT", key: "ZEN", title: "Zentro Web", meta: "31 open" },
  {
    kind: "TASK",
    key: "ZEN-18",
    title: "Fix login redirect loop",
    meta: "In progress",
    live: true,
  },
  { kind: "DOC", title: "Session handling spec", meta: "edited 1h" },
  { kind: "FILE", title: "session-trace.har", meta: "2.1 MB" },
  { kind: "CHAT", title: "#platform · redirect loop", meta: "4 replies" },
  { kind: "MEETING", title: "Auth sync", meta: "Thu 10:00" },
];

const events = [
  { who: "Tom", verb: "finished", key: "ZEN-14", rest: "", status: "done" },
  {
    who: "Arjun",
    verb: "moved",
    key: "BIL-4",
    rest: "to Review",
    status: "review",
  },
  {
    who: "Meera",
    verb: "started",
    key: "ONB-12",
    rest: "",
    status: "in-progress",
  },
  { who: "Lena", verb: "finished", key: "ZEN-21", rest: "", status: "done" },
  {
    who: "Priya",
    verb: "moved",
    key: "BIL-7",
    rest: "to Review",
    status: "review",
  },
  {
    who: "Tom",
    verb: "started",
    key: "ZEN-22",
    rest: "",
    status: "in-progress",
  },
  { who: "Arjun", verb: "finished", key: "BIL-2", rest: "", status: "done" },
  {
    who: "Meera",
    verb: "moved",
    key: "ONB-9",
    rest: "to Review",
    status: "review",
  },
];

const tints = [
  "bg-tint-tasks",
  "bg-tint-projects",
  "bg-tint-docs",
  "bg-tint-teams",
  "bg-tint-audit",
];
const times = ["now", "1m", "4m", "9m"];

export function AuthShowcase() {
  const [tick, setTick] = useState(0);

  // Every 3s the list shifts down one and a new event lands on top.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setTick((value) => value + 1), 3000);

    return () => clearInterval(id);
  }, []);

  const visible = [0, 1, 2, 3].map((offset) => ({
    id: tick - offset,
    event:
      events[
        (((tick - offset) % events.length) + events.length) % events.length
      ]!,
  }));

  return (
    <div
      aria-hidden="true"
      className="flex w-full max-w-[440px] flex-col gap-3.5"
    >
      <p className="eyebrow">Northwind Labs · right now</p>

      <div className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2.5">
          <span className="text-sm font-semibold text-ink">Thread</span>
          <span className="font-mono text-xs text-ink-3">
            {thread.length} linked
          </span>
        </div>
        <ol className="relative pl-[26px]">
          <span className="absolute top-3.5 bottom-3.5 left-1.5 w-px bg-hairline" />
          {thread.map((item) => (
            <li
              key={item.title}
              className="relative flex min-h-11 items-center gap-2.5"
            >
              {item.live ? (
                <span className="absolute -left-6 size-[11px] rounded-full bg-signal shadow-[0_0_0_4px_var(--signal-subtle),0_0_14px_var(--signal)]" />
              ) : (
                <span className="absolute -left-[23px] size-[9px] rounded-full border-[1.5px] border-ink-3 bg-surface" />
              )}
              <span className="w-[52px] flex-none font-mono text-[10px] tracking-[0.08em] text-ink-3">
                {item.kind}
              </span>
              {item.key ? (
                <span className="flex-none rounded-xs border border-hairline px-[5px] font-mono text-xs text-ink-2">
                  {item.key}
                </span>
              ) : null}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  item.live && "font-semibold",
                )}
              >
                {item.title}
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap text-ink-3">
                {item.meta}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-1.5">
          <span className="text-sm font-semibold text-ink">Team pulse</span>
          <div className="flex-1" />
          <span className="size-2 rounded-full bg-status-done motion-safe:animate-[zpulse_2.4s_ease-out_infinite]" />
          <span className="font-mono text-[11px] text-ink-3">LIVE</span>
        </div>
        <ul>
          {visible.map(({ id, event }, index) => (
            <li
              key={id}
              style={{ opacity: 1 - index * 0.14 }}
              className={cn(
                "flex h-10 items-center gap-2.5",
                index > 0 && "border-t border-hairline/60",
                index === 0 && "motion-safe:animate-pulse-in",
              )}
            >
              <span
                className={cn(
                  "flex size-6 flex-none items-center justify-center rounded-full border border-hairline font-mono text-[9px]",
                  tints[event.who.length % tints.length],
                )}
              >
                {initialsOf(event.who)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className="font-medium">{event.who}</span>{" "}
                <span className="text-ink-2">{event.verb}</span>{" "}
                <span className="font-mono text-[13px]">{event.key}</span>{" "}
                <span className="text-ink-2">{event.rest}</span>
              </span>
              <StatusGlyph status={event.status} size={12} decorative />
              <span className="w-[34px] text-right font-mono text-[11px] text-ink-3">
                {times[index]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
