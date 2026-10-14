import {
  BookOpenIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SettingsIcon,
} from "lucide-react";

import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

type Card = {
  key: string;
  title: string;
  priority: "low" | "medium" | "high";
  who: string;
  tone: string;
};

const columns: Array<{ status: string; label: string; cards: Card[] }> = [
  {
    status: "todo",
    label: "To do",
    cards: [
      {
        key: "WEB-14",
        title: "Invite flow copy review",
        priority: "medium",
        who: "MC",
        tone: "bg-info-subtle text-info-text",
      },
      {
        key: "WEB-17",
        title: "Role editor empty state",
        priority: "low",
        who: "DK",
        tone: "bg-success-subtle text-success-text",
      },
    ],
  },
  {
    status: "in-progress",
    label: "In progress",
    cards: [
      {
        key: "WEB-9",
        title: "Audit log export to CSV",
        priority: "high",
        who: "PN",
        tone: "bg-signal-subtle text-signal",
      },
      {
        key: "WEB-12",
        title: "Per-project access roles",
        priority: "high",
        who: "TS",
        tone: "bg-warning-subtle text-warning-text",
      },
    ],
  },
  {
    status: "done",
    label: "Done",
    cards: [
      {
        key: "WEB-3",
        title: "Organization modules page",
        priority: "medium",
        who: "SM",
        tone: "bg-danger-subtle text-danger-text",
      },
    ],
  },
];

const nav = [
  { icon: LayoutDashboardIcon, label: "Dashboard" },
  { icon: FolderKanbanIcon, label: "Projects" },
  { icon: ListChecksIcon, label: "Tasks", active: true },
  { icon: BookOpenIcon, label: "Docs" },
  { icon: SettingsIcon, label: "Settings" },
];

/** A drawn picture of the app, not a screenshot. Sample content only. */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-3xl bg-canvas shadow-xl ring-1 ring-hairline/70",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/50" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/50" />
        <span className="mx-auto rounded-full bg-surface px-10 py-1 text-[0.6875rem] text-ink-3">
          Tasks · Board
        </span>
      </div>

      <div className="flex gap-2 p-2 pt-0">
        <div className="hidden w-44 shrink-0 flex-col gap-1 p-2 sm:flex">
          {nav.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                active
                  ? "bg-surface text-ink shadow-sm ring-1 ring-hairline/60"
                  : "text-ink-2",
              )}
            >
              <Icon className={cn("size-3.5", active && "text-signal")} />
              {label}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-hairline/50">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-xl">Tasks</p>
            <span className="rounded-full bg-sunken p-0.5 text-[0.6875rem] font-medium">
              <span className="rounded-full bg-surface px-2.5 py-1 shadow-sm">
                Board
              </span>
              <span className="px-2.5 py-1 text-ink-2">List</span>
              <span className="px-2.5 py-1 text-ink-2">Calendar</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {columns.map((column) => (
              <div key={column.label} className="rounded-xl bg-sunken p-2">
                <p className="mb-2 flex items-center gap-1.5 px-1 text-[0.6875rem] font-medium text-ink-2">
                  <StatusGlyph status={column.status} size={12} decorative />
                  {column.label}
                </p>
                <div className="space-y-2">
                  {column.cards.map((card) => (
                    <div
                      key={card.key}
                      className="rounded-lg bg-surface p-2.5 shadow-xs ring-1 ring-hairline/50"
                    >
                      <p className="font-mono text-[0.625rem] text-ink-3">
                        {card.key}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug font-medium text-ink">
                        {card.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <PriorityGlyph
                          priority={card.priority}
                          size={12}
                          decorative
                        />
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full text-[0.5625rem] font-semibold",
                            card.tone,
                          )}
                        >
                          {card.who}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
