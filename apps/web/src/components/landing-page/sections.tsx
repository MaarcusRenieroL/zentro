import Link from "next/link";
import {
  BookOpenIcon,
  CheckIcon,
  MessageSquareIcon,
  PaperclipIcon,
  VideoIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { DotMatrix } from "@zentro/ui/components/dot-matrix";
import { Kbd } from "@zentro/ui/components/kbd";
import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { TeamPulse } from "@zentro/ui/components/team-pulse";
import { Thread, ThreadItem } from "@zentro/ui/components/thread";
import { Tile } from "@zentro/ui/components/tile";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

import { Reveal } from "./reveal";

function Heading({
  id,
  children,
  accent,
  lead,
  className,
}: {
  id?: string;
  children: ReactNode;
  accent?: string;
  lead: string;
  className?: string;
}) {
  return (
    <div id={id} className={cn("max-w-xl scroll-mt-24", className)}>
      <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance text-ink sm:text-5xl">
        {children}{" "}
        {accent ? (
          <span className="font-serif-italic tracking-normal">{accent}</span>
        ) : null}
      </h2>
      <p className="mt-5 text-lg text-pretty text-ink-2">{lead}</p>
    </div>
  );
}

/** Today, in a glass tile: the one task and what comes after. */
export function TodaySection() {
  return (
    <section className="border-y border-hairline bg-surface px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Reveal>
          <Heading
            id="today"
            accent="next"
            lead="Open Zentro and there is one task and one button. It picks the task for you: what is late, what is due today, then what matters most."
          >
            Know what to do
          </Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <div
              aria-hidden="true"
              className="halo absolute -inset-20 -z-10 opacity-70"
            />
            <div className="glass p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <StatusGlyph status="todo" size={18} />
                <TaskKey>ZEN-12</TaskKey>
                <span className="text-sm text-ink-2">Launch</span>
              </div>
              <p className="mt-4 font-display text-3xl leading-[1.1] text-ink sm:text-4xl">
                Ship the onboarding emails
              </p>
              <p className="mt-3 text-sm text-ink-2">
                Due yesterday, so it comes first.
              </p>
              <div className="mt-7 flex items-center gap-4">
                <Button size="start" tabIndex={-1}>
                  Start{" "}
                  <Kbd className="ml-1 border-transparent bg-on-signal/20 text-on-signal">
                    S
                  </Kbd>
                </Button>
              </div>
              <ul className="mt-8 border-t border-hairline pt-2">
                {[
                  ["todo", "ZEN-15", "Review the pricing page copy"],
                  ["in-progress", "ZEN-9", "Dark mode polish"],
                ].map(([status, key, title]) => (
                  <li
                    key={key}
                    className="flex h-12 items-center gap-3 text-sm"
                  >
                    <StatusGlyph status={status!} size={16} decorative />
                    <TaskKey>{key}</TaskKey>
                    <span className="truncate text-ink-2">{title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const columns = [
  {
    status: "in-progress",
    label: "In progress",
    cards: [
      ["ZEN-9", "Dark mode polish"],
      ["ZEN-12", "Onboarding emails"],
    ],
  },
  {
    status: "review",
    label: "In review",
    cards: [["ZEN-7", "Pricing page copy"]],
  },
  {
    status: "done",
    label: "Done",
    cards: [
      ["ZEN-4", "Import the CSV"],
      ["ZEN-3", "Invite flow"],
    ],
  },
];

/** The pulse and a board: work moving, visible to everyone. */
export function TeamSection() {
  return (
    <section className="bg-canvas px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <Heading
            id="team"
            accent="move"
            lead="Everyone sees who started, who is waiting on review, and what just got finished. No status meetings, no guessing."
          >
            See the team
          </Heading>
        </Reveal>
        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Reveal>
            <Tile title="Team pulse" className="h-full">
              <TeamPulse
                items={[
                  {
                    id: "1",
                    actor: "Ines",
                    verb: "finished",
                    taskKey: "ZEN-4",
                    title: "Import the CSV",
                    when: "2m",
                  },
                  {
                    id: "2",
                    actor: "Jon",
                    verb: "moved",
                    taskKey: "ZEN-7",
                    title: "Pricing page copy",
                    when: "11m",
                  },
                  {
                    id: "3",
                    actor: "Mara",
                    verb: "started",
                    taskKey: "ZEN-12",
                    title: "Onboarding emails",
                    when: "14m",
                  },
                  {
                    id: "4",
                    actor: "Dev",
                    verb: "created",
                    taskKey: "ZEN-18",
                    title: "Audit export",
                    when: "1h",
                  },
                ]}
              />
              <div className="mt-6 border-t border-hairline pt-5">
                <DotMatrix
                  label="Team activity this week"
                  values={[3, 6, 9, 5, 10, 2, 1]}
                  labels={["M", "T", "W", "T", "F", "S", "S"]}
                />
              </div>
            </Tile>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="tile grid h-full gap-3 bg-sunken/50 p-4 sm:grid-cols-3">
              {columns.map((column) => (
                <div key={column.label} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 px-1 text-sm font-medium text-ink">
                    <StatusGlyph status={column.status} size={14} decorative />
                    {column.label}
                  </p>
                  {column.cards.map(([key, title]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-hairline bg-surface p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <TaskKey>{key}</TaskKey>
                        <PriorityGlyph priority="medium" size={14} decorative />
                      </div>
                      <p className="mt-1.5 text-sm text-ink">{title}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const thread = [
  {
    icon: CheckIcon,
    label: "Ship the onboarding emails",
    meta: "ZEN-12",
    active: true,
  },
  { icon: BookOpenIcon, label: "Launch notes", meta: "Doc" },
  { icon: PaperclipIcon, label: "email-copy-v3.pdf", meta: "File" },
  { icon: MessageSquareIcon, label: "Can we send on Thursday?", meta: "Chat" },
  { icon: VideoIcon, label: "Launch sync", meta: "Meeting" },
];

/** One line that ties a task to everything around it. */
export function ThreadSection() {
  return (
    <section className="border-y border-hairline bg-surface px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <Reveal className="order-2 lg:order-1">
          <div className="tile tile-hero p-6 sm:p-10">
            <Thread>
              {thread.map((item) => (
                <ThreadItem
                  key={item.label}
                  active={item.active}
                  className="pb-7"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-sunken text-ink-2 [&_svg]:size-4">
                      <item.icon aria-hidden="true" />
                    </span>
                    <span
                      className={cn(
                        "text-base",
                        item.active ? "font-medium text-ink" : "text-ink-2",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="ml-auto font-mono text-xs text-ink-3">
                      {item.meta}
                    </span>
                  </div>
                </ThreadItem>
              ))}
            </Thread>
          </div>
        </Reveal>
        <Reveal className="order-1 lg:order-2">
          <Heading
            id="thread"
            accent="linked"
            lead="A task knows its docs, its files, its conversation and its meeting. Follow the Thread instead of searching for context."
          >
            Everything
          </Heading>
        </Reveal>
      </div>
    </section>
  );
}

const roles = ["Owner", "Admin", "Member", "Viewer"];
const grants: Array<[string, boolean[]]> = [
  ["Create tasks", [true, true, true, false]],
  ["Edit any doc", [true, true, false, false]],
  ["Manage members", [true, true, false, false]],
  ["Export the audit log", [true, false, false, false]],
];

/** Roles and the audit log, small and precise. */
export function ControlSection() {
  return (
    <section className="bg-canvas px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <Heading
            id="control"
            accent="log"
            lead="Build roles down to a single project. Every change is recorded, filterable and exportable."
          >
            Roles and the audit
          </Heading>
        </Reveal>
        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <Reveal>
            <Tile title="Permission matrix" flush className="h-full">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[22rem] text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th
                        scope="col"
                        className="px-(--pad-tile) py-3 text-left font-medium text-ink-2"
                      >
                        Permission
                      </th>
                      {roles.map((role) => (
                        <th
                          key={role}
                          scope="col"
                          className="px-2 py-3 text-center font-medium text-ink-2"
                        >
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grants.map(([label, row]) => (
                      <tr
                        key={label}
                        className="border-b border-hairline last:border-b-0"
                      >
                        <th
                          scope="row"
                          className="px-(--pad-tile) py-3 text-left font-normal text-ink"
                        >
                          {label}
                        </th>
                        {row.map((granted, index) => (
                          <td key={index} className="px-2 py-3 text-center">
                            {granted ? (
                              <CheckIcon
                                className="mx-auto size-4 text-status-done"
                                aria-label="Allowed"
                              />
                            ) : (
                              <span
                                className="font-mono text-ink-disabled"
                                aria-label="Not allowed"
                              >
                                –
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tile>
          </Reveal>
          <Reveal delay={0.1}>
            <Tile title="Audit log" flush className="h-full">
              <ol>
                {[
                  [
                    "Priya moved ZEN-12 from To do to In progress",
                    "task.status_changed",
                    "11:40",
                  ],
                  [
                    "Daniel created the role Viewer plus comment",
                    "role.created",
                    "11:12",
                  ],
                  [
                    "Mei Lin commented on the doc Launch notes",
                    "doc.comment_created",
                    "10:48",
                  ],
                ].map(([sentence, action, time]) => (
                  <li
                    key={action}
                    className="flex items-start gap-3 border-b border-hairline px-(--pad-tile) py-3.5 last:border-b-0"
                  >
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full border border-line-strong bg-surface" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{sentence}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-3">
                        {action}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-ink-3">{time}</span>
                  </li>
                ))}
              </ol>
            </Tile>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-canvas px-5 py-28 text-center sm:py-36">
      <div
        aria-hidden="true"
        className="halo absolute top-1/2 left-1/2 -z-10 h-[34rem] w-[50rem] -translate-x-1/2 -translate-y-1/2"
      />
      <Reveal className="mx-auto max-w-2xl">
        <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance text-ink sm:text-6xl">
          Open it tomorrow morning and know what to{" "}
          <span className="font-serif-italic tracking-normal">start</span>
        </h2>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="px-7">
            <Link href={paths.auth.signUp()}>Start free</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href={paths.auth.signIn()}>Sign in</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
