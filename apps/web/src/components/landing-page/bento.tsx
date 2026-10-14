import {
  BookOpenIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  KanbanIcon,
  ListIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

import { Reveal } from "./reveal";
import { Section } from "./section";

function Tile({
  className,
  icon,
  title,
  text,
  children,
  delay,
}: {
  className?: string;
  icon: ReactNode;
  title: string;
  text: string;
  children?: ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-hairline/60 transition-shadow duration-200 hover:shadow-md sm:p-8">
        <span className="flex size-10 items-center justify-center rounded-xl bg-signal-subtle text-signal [&_svg]:size-5">
          {icon}
        </span>
        <h3 className="mt-5 font-display text-2xl text-ink">{title}</h3>
        <p className="mt-2 max-w-md text-ink-2">{text}</p>
        {children ? <div className="mt-6 flex-1">{children}</div> : null}
      </div>
    </Reveal>
  );
}

const projectRows = [
  { name: "Customer Portal", key: "WEB", open: 12, status: "Active" },
  { name: "Mobile App", key: "APP", open: 7, status: "Active" },
  { name: "Brand refresh", key: "BRD", open: 0, status: "Archived" },
];

const statuses = [
  { status: "backlog", label: "Backlog" },
  { status: "todo", label: "To do" },
  { status: "in-progress", label: "In progress" },
  { status: "review", label: "In review" },
  { status: "done", label: "Done" },
];

export function Bento() {
  return (
    <Section
      id="product"
      eyebrow="The product"
      title="Everything a team needs to ship, in one place"
      lead="Plan projects, track tasks on the view that suits you, and write the docs next to the work."
    >
      <div className="grid gap-4 md:grid-cols-6">
        <Tile
          className="md:col-span-4"
          icon={<FolderKanbanIcon />}
          title="Projects"
          text="A home for each piece of work, with its own tasks, docs, activity and access."
        >
          <div className="space-y-2">
            {projectRows.map((row) => (
              <div
                key={row.key}
                className="flex items-center gap-3 rounded-2xl bg-sunken px-4 py-3"
              >
                <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-ink-2 ring-1 ring-hairline/60">
                  {row.key}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-ink">
                  {row.name}
                </span>
                <span className="text-xs text-ink-2">{row.open} open</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    row.status === "Active"
                      ? "bg-success-subtle text-success-text"
                      : "bg-surface text-ink-3",
                  )}
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          className="md:col-span-2"
          icon={<UsersRoundIcon />}
          title="Teams"
          text="Group people into teams and give a whole team a role at once."
          delay={0.05}
        />

        <Tile
          className="md:col-span-3"
          icon={<KanbanIcon />}
          title="Tasks, your way"
          text="Board, list and calendar over the same tasks, plus an overview of what is overdue."
          delay={0.05}
        >
          <div className="flex flex-wrap gap-2">
            {[
              [KanbanIcon, "Board"],
              [ListIcon, "List"],
              [CalendarDaysIcon, "Calendar"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof KanbanIcon;

              return (
                <span
                  key={label as string}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-sm font-medium text-ink"
                >
                  <I className="size-4 text-ink-2" />
                  {label as string}
                </span>
              );
            })}
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
            {statuses.map(({ status, label }) => (
              <li key={status} className="flex items-center gap-2">
                <StatusGlyph status={status} size={14} decorative />
                {label}
              </li>
            ))}
          </ul>
        </Tile>

        <Tile
          className="md:col-span-3"
          icon={<BookOpenIcon />}
          title="Docs"
          text="Write specs and notes in a rich editor, comment inline, and keep them with the project they belong to."
          delay={0.1}
        >
          <div className="rounded-2xl bg-sunken p-5">
            <p className="font-display text-xl text-ink">Launch checklist</p>
            <div className="mt-3 space-y-2">
              <div className="h-2.5 w-11/12 rounded-full bg-hairline/70" />
              <div className="h-2.5 w-9/12 rounded-full bg-hairline/70" />
              <div className="h-2.5 w-10/12 rounded-full bg-hairline/70" />
            </div>
          </div>
        </Tile>
      </div>
    </Section>
  );
}
