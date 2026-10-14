"use client";

import { useEffect, useState } from "react";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  PaperclipIcon,
} from "lucide-react";

import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { Thread, ThreadItem } from "@zentro/ui/components/thread";

// A decorative fragment of the product: a task, and what is linked to it, on
// one Thread, with a team pulse that keeps moving. The names are illustrative.
const thread = [
  {
    icon: CheckCircle2Icon,
    label: "Ship the onboarding emails",
    meta: "ZEN-12",
  },
  { icon: BookOpenIcon, label: "Launch notes", meta: "Doc" },
  { icon: PaperclipIcon, label: "email-copy-v3.pdf", meta: "File" },
  { icon: MessageSquareIcon, label: "Can we send Thursday?", meta: "Chat" },
];

const events = [
  { actor: "Mara", verb: "started", key: "ZEN-12", status: "in-progress" },
  { actor: "Jon", verb: "moved", key: "ZEN-9", status: "review" },
  { actor: "Ines", verb: "finished", key: "ZEN-4", status: "done" },
  { actor: "Dev", verb: "started", key: "ZEN-15", status: "in-progress" },
  { actor: "Mara", verb: "finished", key: "ZEN-12", status: "done" },
  { actor: "Jon", verb: "finished", key: "ZEN-9", status: "done" },
];

export function AuthShowcase() {
  const [cursor, setCursor] = useState(3);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setCursor((value) => value + 1), 2600);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setActive((value) => (value + 1) % thread.length),
      3400,
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearInterval(id);
    }

    return () => clearInterval(id);
  }, []);

  const visible = Array.from({ length: 4 }, (_, index) => {
    const at = cursor - index;

    return {
      id: at,
      event: events[((at % events.length) + events.length) % events.length]!,
    };
  });

  return (
    <div aria-hidden="true" className="flex w-full max-w-md flex-col gap-4">
      <div className="tile tile-hero p-6">
        <p className="eyebrow mb-4">Everything linked</p>
        <Thread>
          {thread.map((item, index) => (
            <ThreadItem key={item.label} active={index === active}>
              <div className="flex items-center gap-2 text-sm">
                <item.icon className="size-4 text-ink-3" />
                <span className="truncate text-ink">{item.label}</span>
                <span className="ml-auto font-mono text-[11px] text-ink-3">
                  {item.meta}
                </span>
              </div>
            </ThreadItem>
          ))}
        </Thread>
      </div>

      <div className="tile p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-done motion-safe:animate-live" />
          <span className="eyebrow">Team pulse</span>
        </div>
        <ul className="overflow-hidden">
          {visible.map(({ id, event }, index) => (
            <li
              key={id}
              className={
                index === 0
                  ? "flex h-10 items-center gap-2.5 text-sm motion-safe:animate-pulse-in"
                  : "flex h-10 items-center gap-2.5 text-sm opacity-90"
              }
              style={
                index > 1 ? { opacity: 0.55 - (index - 2) * 0.2 } : undefined
              }
            >
              <StatusGlyph status={event.status} size={14} decorative />
              <span className="text-ink-2">
                <span className="font-medium text-ink">{event.actor}</span>{" "}
                {event.verb} <TaskKey>{event.key}</TaskKey>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
