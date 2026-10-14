"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  FolderIcon,
  ArrowRightIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { DayRing } from "@zentro/ui/components/day-ring";
import { DotMatrix } from "@zentro/ui/components/dot-matrix";
import { Kbd } from "@zentro/ui/components/kbd";
import {
  PriorityGlyph,
  StatusGlyph,
  priorityLabels,
} from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { TeamPulse, type PulseItem } from "@zentro/ui/components/team-pulse";
import { Tile, type TileTint } from "@zentro/ui/components/tile";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";
import { describeFocusReason, formatDueDate, rankTasks } from "@zentro/utils";

import { useReachable } from "~/src/components/permissions/permission-provider";
import type { DashboardWorkItem } from "~/src/lib/dashboard-data";
import type { TodayData, TodayTask } from "~/src/lib/today-data";

type Props = {
  firstName: string;
  data: TodayData;
  recentWork: DashboardWorkItem[];
  links: { tasks?: string };
};

const dayMs = 86_400_000;

function startOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

function dueLabel(dueAt: string | null) {
  if (!dueAt) return null;

  const due = formatDueDate(dueAt);

  return { text: due.text, full: due.full, late: due.tone === "overdue" };
}

function shortAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function RunningTimer({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <span
      role="timer"
      aria-label="Time on this task"
      className="inline-flex items-center gap-2 font-mono text-lg font-medium text-warning-text tabular-nums"
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-status-progress motion-safe:animate-pulse"
      />
      {clock(now - new Date(since).getTime())}
    </span>
  );
}

const workTint: Record<DashboardWorkItem["kind"], TileTint> = {
  doc: "docs",
  project: "projects",
  task: "tasks",
};
const workIcon = {
  doc: BookOpenIcon,
  project: FolderIcon,
  task: CheckCircle2Icon,
} as const;

export function TodayView({ firstName, data, recentWork, links }: Props) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const canAssign = useReachable("tasks.assign");
  const [tasks, setTasks] = useState<TodayTask[]>(data.tasks);
  const [done, setDone] = useState(data.doneToday);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<PulseItem[]>([]);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [greeting, setGreeting] = useState<{
    hello: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    setGreeting({
      hello:
        hour < 12
          ? "Good morning"
          : hour < 18
            ? "Good afternoon"
            : "Good evening",
      date: now
        .toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
        .replace(",", "")
        .toUpperCase(),
    });
  }, []);

  // Teammates move work too: look again every half minute.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);

    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (!celebrating) {
      setTasks(data.tasks);
      setDone(data.doneToday);
    }
  }, [data.tasks, data.doneToday, celebrating]);

  const ranked = useMemo(() => rankTasks(tasks), [tasks]);
  const focus = ranked[0] ?? null;
  const task = focus?.task ?? null;
  const next = ranked.slice(1, 4);
  const today = startOfToday();
  const dueToday = tasks.filter(
    (item) =>
      item.dueAt &&
      new Date(item.dueAt).getTime() < today + dayMs &&
      new Date(item.dueAt).getTime() >= today,
  ).length;
  const planned =
    done +
    tasks.filter(
      (item) =>
        item.key === task?.key ||
        item.status === "in-progress" ||
        (item.dueAt && new Date(item.dueAt).getTime() < today + dayMs),
    ).length;
  const running = task?.status === "in-progress";

  const pulse: PulseItem[] = useMemo(
    () => [
      ...local,
      ...data.pulse.map((item) => ({
        id: item.id,
        actor: item.actor,
        verb: item.verb,
        taskKey: item.taskKey,
        title: item.title,
        href: item.href,
        when: shortAgo(item.at),
      })),
    ],
    [local, data.pulse],
  );

  const announce = useCallback((verb: PulseItem["verb"], item: TodayTask) => {
    const id = `local-${item.key}-${verb}-${Date.now()}`;

    setLocal((current) =>
      [
        {
          id,
          actor: "You",
          verb,
          taskKey: item.key,
          title: item.name,
          href: item.href,
          when: "now",
        },
        ...current,
      ].slice(0, 4),
    );
    setFresh(new Set([id]));
  }, []);

  const setStatus = useCallback(
    async (item: TodayTask, status: "in-progress" | "done") => {
      await trpc.task.updateTaskByKey.mutate({ key: item.key, status });
    },
    [trpc],
  );

  const start = useCallback(async () => {
    if (!task || busy || task.status === "in-progress") return;

    setBusy(true);

    const previous = tasks;

    setTasks((current) =>
      current.map((item) =>
        item.key === task.key
          ? {
              ...item,
              status: "in-progress",
              startedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    announce("started", task);

    try {
      await setStatus(task, "in-progress");
    } catch {
      setTasks(previous);
      toastError(
        "Could not start the task",
        "Your change was not saved. Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }, [task, busy, tasks, announce, setStatus]);

  const finish = useCallback(async () => {
    if (!task || busy || celebrating) return;

    setBusy(true);
    setCelebrating(task.key);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    try {
      await setStatus(task, "done");
    } catch {
      setCelebrating(null);
      setBusy(false);
      toastError(
        "Could not mark the task done",
        "Your change was not saved. Try again in a moment.",
      );

      return;
    }

    announce("finished", task);
    // The day counter ticks up, then the next task slides in.
    setTimeout(() => setDone((count) => count + 1), reduced ? 0 : 380);
    setTimeout(
      () => {
        setTasks((current) => current.filter((item) => item.key !== task.key));
        setCelebrating(null);
        setBusy(false);
        router.refresh();
      },
      reduced ? 0 : 900,
    );
  }, [task, busy, celebrating, announce, setStatus, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.closest(
          "input, textarea, select, [contenteditable='true'], [role='dialog']",
        )
      ) {
        return;
      }

      if (event.key.toLowerCase() === "s" && !running) void start();
      if (event.key.toLowerCase() === "d" && running) void finish();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [running, start, finish]);

  const pullNext = async () => {
    const item = data.unassignedNext;

    if (!item || !data.memberId) return;

    try {
      await trpc.task.updateTaskByKey.mutate({
        key: item.key,
        assignedToMemberId: data.memberId,
      });
      router.refresh();
    } catch {
      toastError(
        "Could not take that task",
        "You may not be allowed to assign tasks here.",
      );
    }
  };

  const reason = focus ? describeFocusReason(focus.reason) : null;
  const due = task ? dueLabel(task.dueAt) : null;
  const total = Math.max(planned, done);

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="eyebrow" suppressHydrationWarning>
          {greeting ? `${greeting.date} · ` : ""}
          {dueToday} due today
        </p>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-[2.5rem]">
          {greeting?.hello ?? "Welcome back"},{" "}
          <span className="font-serif-italic text-[1.15em]">{firstName}</span>
        </h1>
      </header>

      <div className="grid gap-(--gap) lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-4">
        <div className="relative flex flex-col gap-4">
          <div
            aria-hidden="true"
            className="halo absolute -top-24 left-1/2 -z-10 h-[30rem] w-[44rem] -translate-x-1/2 opacity-90"
          />
          <Tile hero className="relative" data-testid="focus-tile">
            {task ? (
              <div
                key={task.key}
                className="flex min-h-72 flex-col justify-between gap-8 motion-safe:animate-fade-up"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusGlyph
                      status={celebrating === task.key ? "done" : task.status}
                      size={18}
                      celebrate={celebrating === task.key}
                      decorative={false}
                    />
                    <TaskKey>{task.key}</TaskKey>
                    <span className="text-sm text-ink-2">
                      {task.projectName}
                    </span>
                  </div>
                  <h2
                    className={cn(
                      "max-w-[20ch] font-display text-[2.5rem] leading-[1.08] text-balance text-ink transition-[color,text-decoration-color] duration-200 sm:text-5xl sm:leading-[52px]",
                      celebrating === task.key &&
                        "text-ink-3 line-through decoration-status-done decoration-2",
                    )}
                  >
                    {task.name}
                  </h2>
                  <p className="text-sm text-ink-2">{reason}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
                    {due ? (
                      <span
                        className={cn(
                          "rounded-sm px-2 py-0.5 font-mono text-xs",
                          due.late
                            ? "bg-danger-subtle text-danger-text"
                            : "bg-sunken text-ink-2",
                        )}
                      >
                        {due.text}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <PriorityGlyph
                        priority={task.priority}
                        size={14}
                        decorative
                      />
                      {priorityLabels[task.priority] ?? task.priority}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {running ? (
                    <Button
                      size="start"
                      onClick={finish}
                      loading={busy && celebrating === task.key}
                      disabled={busy}
                    >
                      <CheckCircle2Icon />
                      Mark done
                      <Kbd className="ml-1 border-transparent bg-on-signal/20 text-on-signal">
                        D
                      </Kbd>
                    </Button>
                  ) : (
                    <Button size="start" onClick={start} disabled={busy}>
                      Start
                      <Kbd className="ml-1 border-transparent bg-on-signal/20 text-on-signal">
                        S
                      </Kbd>
                    </Button>
                  )}
                  {running && task.startedAt ? (
                    <RunningTimer since={task.startedAt} />
                  ) : null}
                  <Button asChild variant="ghost" className="ml-auto">
                    <Link href={task.href}>
                      Open task <ArrowRightIcon />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-start justify-center gap-4">
                <h2 className="font-serif-italic text-6xl leading-none text-ink">
                  Nothing left today.
                </h2>
                <p className="max-w-md text-base text-ink-2">
                  {done > 0
                    ? `${done} finished. The rest of the day is yours.`
                    : "No open tasks are assigned to you."}
                </p>
                {data.unassignedNext && canAssign ? (
                  <button
                    type="button"
                    onClick={pullNext}
                    className="inline-flex items-center gap-2 rounded-sm text-sm text-ink-2 underline decoration-line-strong underline-offset-4 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Pull in <TaskKey>{data.unassignedNext.key}</TaskKey>{" "}
                    {data.unassignedNext.name}
                  </button>
                ) : links.tasks ? (
                  <Link
                    href={links.tasks}
                    className="text-sm text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
                  >
                    Look through all tasks
                  </Link>
                ) : null}
              </div>
            )}
          </Tile>

          {next.length ? (
            <Tile title="Then" flush>
              <ul>
                {next.map(({ task: item }) => {
                  const itemDue = dueLabel(item.dueAt);

                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="flex h-(--row-h) items-center gap-3 px-(--pad-tile) transition-colors duration-(--duration-fast) hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
                      >
                        <StatusGlyph status={item.status} size={16} />
                        <TaskKey>{item.key}</TaskKey>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {item.name}
                        </span>
                        {itemDue ? (
                          <span
                            className={cn(
                              "font-mono text-xs",
                              itemDue.late ? "text-danger-text" : "text-ink-3",
                            )}
                          >
                            {itemDue.text}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Tile>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Tile title="Today">
            <div className="flex items-center gap-5">
              <DayRing done={done} planned={total} size={112} />
              <div className="flex flex-col gap-1">
                <p className="text-sm text-ink">
                  {done === 0
                    ? "Nothing finished yet."
                    : `${done} finished today.`}
                </p>
                <p className="font-mono text-xs text-ink-3">
                  {Math.max(total - done, 0)} left on the plan
                </p>
              </div>
            </div>
          </Tile>

          <Tile title="Team pulse">
            <TeamPulse
              items={pulse.slice(0, 6)}
              freshIds={fresh}
              LinkComponent={Link}
              empty="Nobody has moved work yet today."
            />
          </Tile>

          <Tile title="This week">
            <DotMatrix
              label="Task activity over the last seven days"
              values={data.week.map((day) => day.count)}
              labels={data.week.map((day) => day.label)}
            />
          </Tile>
        </div>
      </div>

      {recentWork.length ? (
        <section aria-labelledby="recent-work" className="flex flex-col gap-3">
          <h2 id="recent-work" className="text-sm font-semibold text-ink">
            Recent work
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {recentWork.map((item) => {
              const Icon = workIcon[item.kind];

              return (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Tile
                      tint={workTint[item.kind]}
                      icon={<Icon />}
                      className="h-full transition-colors duration-(--duration-fast) group-hover:border-line-strong"
                    >
                      <p className="line-clamp-2 min-h-10 text-sm font-medium text-ink">
                        {item.title}
                      </p>
                      <p className="mt-3 font-mono text-[11px] text-ink-3 uppercase">
                        {item.label} · {item.updatedAt}
                      </p>
                    </Tile>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
