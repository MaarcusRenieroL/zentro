"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { Kbd } from "@zentro/ui/components/kbd";
import {
  StatusGlyph,
  priorityLabels,
} from "@zentro/ui/components/status-glyph";
import { type PulseItem } from "@zentro/ui/components/team-pulse";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";
import { describeFocusReason, formatDueDate, rankTasks } from "@zentro/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";
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

  return {
    text: due.text,
    full: due.full,
    late: due.tone === "overdue",
    tone: due.tone,
  };
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
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
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
      className="font-mono text-[34px] leading-none tracking-[-0.03em] text-ink tabular-nums sm:text-[44px]"
    >
      {clock(now - new Date(since).getTime())}
    </span>
  );
}

const workTint: Record<DashboardWorkItem["kind"], string> = {
  doc: "bg-tint-docs!",
  project: "bg-tint-projects!",
  task: "bg-tint-tasks!",
};

export function TodayView({ firstName, data, recentWork, links }: Props) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const canAssign = useReachable("tasks.assign");
  const canCreateTask = useReachable("tasks.create");
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
  const overdue = tasks.filter(
    (item) => item.dueAt && new Date(item.dueAt).getTime() < today,
  ).length;
  const counts = [
    overdue ? `${overdue} overdue` : null,
    dueToday || !overdue ? `${dueToday} due today` : null,
  ]
    .filter(Boolean)
    .join(" · ");
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
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const workingNow = new Set(
    pulse
      .filter((item) => item.verb === "started" || item.verb === "moved")
      .map((item) => item.actor),
  ).size;
  const weekTotal = data.week.reduce((sum, day) => sum + day.count, 0);
  const todayIndex = data.week.length - 1;
  const priorityBars =
    task?.priority === "high" ? 3 : task?.priority === "low" ? 1 : 2;
  const startedMs = task?.startedAt ? new Date(task.startedAt).getTime() : null;

  return (
    <div className="flex w-full flex-col">
      <header className="flex flex-col gap-2">
        <p className="eyebrow" suppressHydrationWarning>
          {greeting ? `${greeting.date} · ` : ""}
          {counts}
        </p>
        <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
          {greeting?.hello ?? "Welcome back"},{" "}
          <span className="font-serif-italic text-[1.12em] tracking-[-0.01em]">
            {firstName}
          </span>
        </h1>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-12">
        <section
          data-testid="focus-tile"
          className="tile tile-hero relative col-span-2 flex min-h-[340px] flex-col gap-[18px] overflow-hidden p-[22px] lg:col-span-8 lg:row-span-2 lg:min-h-[400px] lg:px-8 lg:py-7"
        >
          <div
            aria-hidden="true"
            className="halo absolute -top-[220px] -right-[180px] size-[560px]"
          />
          {task ? (
            <div
              key={task.key}
              className="relative flex flex-1 flex-col gap-[18px] motion-safe:animate-fade-up"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="eyebrow">Focus</span>
                <span className="font-mono text-[13px] text-ink-2">
                  {task.key}
                </span>
                <span className="flex h-6 items-center gap-1.5 rounded-sm border border-hairline pr-2 pl-1 text-xs text-ink-2">
                  <span className="flex size-4 items-center justify-center rounded-[5px] bg-tint-projects font-mono text-[8px] text-ink">
                    {task.projectName.charAt(0).toUpperCase()}
                  </span>
                  {task.projectName}
                </span>
                <span className="flex-1" />
                {due ? (
                  <span
                    className={cn(
                      "flex h-6 items-center gap-1.5 rounded-sm px-2 font-mono text-xs",
                      due.tone === "overdue"
                        ? "bg-danger-subtle text-danger-text"
                        : due.tone === "soon"
                          ? "bg-warning-subtle text-warning-text"
                          : "bg-sunken text-ink-2",
                    )}
                    title={due.full}
                  >
                    {due.tone === "overdue" ? (
                      <span
                        aria-hidden="true"
                        className="size-1.5 rotate-45 rounded-[1px] bg-current"
                      />
                    ) : due.tone === "soon" ? (
                      <span
                        aria-hidden="true"
                        className="size-[7px] rounded-full border-[1.5px] border-current"
                      />
                    ) : null}
                    {due.text}
                  </span>
                ) : null}
                <span
                  className="flex items-center gap-1.5 text-xs text-ink-2"
                  role="img"
                  aria-label={`Priority: ${priorityLabels[task.priority] ?? task.priority}`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-[13px] items-end gap-0.5"
                  >
                    {[4, 7, 10, 13].map((height, index) => (
                      <span
                        key={height}
                        style={{ height }}
                        className={cn(
                          "w-[3px] rounded-[1px]",
                          index < priorityBars ? "bg-ink" : "bg-hairline",
                        )}
                      />
                    ))}
                  </span>
                  {priorityLabels[task.priority] ?? task.priority}
                </span>
              </div>

              <h2
                className={cn(
                  "relative max-w-[680px] font-display text-[2rem] leading-9 tracking-[-0.035em] text-balance text-ink transition-[color,text-decoration-color] duration-200 sm:text-5xl sm:leading-[52px]",
                  celebrating === task.key &&
                    "text-ink-3 line-through decoration-status-done decoration-2",
                )}
              >
                {task.name}
              </h2>
              <p className="relative max-w-[560px] text-[15px] leading-[22px] text-ink-2">
                {reason}
              </p>

              <div className="flex-1" />

              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="eyebrow">Time today</span>
                  {running && task.startedAt ? (
                    <RunningTimer since={task.startedAt} />
                  ) : (
                    <span className="font-mono text-[34px] leading-none tracking-[-0.03em] text-ink-3 sm:text-[44px]">
                      00:00:00
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[13px] text-ink-3">
                    {running && startedMs ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full border-[1.5px] border-status-progress"
                        />
                        Running since{" "}
                        {new Date(startedMs).toLocaleTimeString("en-GB", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </>
                    ) : (
                      "Not started"
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="lg" asChild>
                    <Link href={task.href}>
                      Open task
                      <ArrowRightIcon />
                    </Link>
                  </Button>
                  {running ? (
                    <Button
                      size="lg"
                      onClick={finish}
                      loading={busy && celebrating === task.key}
                      disabled={busy}
                    >
                      Mark done
                      <Kbd className="ml-1 border-transparent bg-on-signal/20 text-on-signal">
                        D
                      </Kbd>
                    </Button>
                  ) : (
                    <Button size="lg" onClick={start} disabled={busy}>
                      Start
                      <Kbd className="ml-1 border-transparent bg-on-signal/20 text-on-signal">
                        S
                      </Kbd>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-1 flex-col gap-[18px]">
              <span className="eyebrow">Focus</span>
              <div className="flex-1" />
              {data.hasAnyTasks ? (
                <>
                  <h2 className="font-serif-italic text-[2.75rem] leading-none tracking-[-0.01em] sm:text-[4rem]">
                    Nothing left today.
                  </h2>
                  <p className="max-w-[520px] text-[15px] leading-[22px] text-ink-2">
                    {done > 0
                      ? `You finished ${done} ${done === 1 ? "task" : "tasks"} today. The rest of the day is yours.`
                      : "No open tasks are assigned to you."}
                  </p>
                  {data.unassignedNext && canAssign ? (
                    <button
                      type="button"
                      onClick={pullNext}
                      className="flex items-center gap-2 self-start rounded-sm text-[15px] text-signal outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Pull {data.unassignedNext.key} “{data.unassignedNext.name}
                      ” into today
                      <ArrowRightIcon className="size-3.5" />
                    </button>
                  ) : links.tasks ? (
                    <Link
                      href={links.tasks}
                      className="flex items-center gap-2 self-start text-[15px] text-signal hover:underline"
                    >
                      Look through all tasks
                      <ArrowRightIcon className="size-3.5" />
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 className="font-serif-italic text-[2.75rem] leading-none tracking-[-0.01em] sm:text-[4rem]">
                    No tasks yet.
                  </h2>
                  <p className="max-w-[520px] text-[15px] leading-[22px] text-ink-2">
                    Tasks you create or get assigned show up here, with the most
                    important one in this spot. Each gets a key like ZEN-1.
                  </p>
                  {canCreateTask ? (
                    <div className="flex items-center gap-3.5">
                      <CreateTaskModal onTaskCreated={() => router.refresh()} />
                      <span className="text-[13px] text-ink-3">
                        or press <Kbd>C</Kbd>
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </section>

        <section
          aria-label="Your day"
          className="tile col-span-2 flex items-center gap-5 p-5 lg:col-span-4"
        >
          {total === 0 ? (
            <div className="flex size-[120px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line-strong px-6 text-center font-mono text-[11px] text-ink-3">
              Nothing planned
            </div>
          ) : (
            <div
              role="img"
              aria-label={`${done} of ${total} done`}
              className="flex size-[120px] shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--status-done) 0 ${pct}%, var(--hairline) ${pct}% 100%)`,
              }}
            >
              <div className="flex size-[84px] items-center justify-center rounded-full bg-surface font-mono text-xs text-ink-3">
                {pct}%
              </div>
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="eyebrow">Your day</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-serif-italic text-[44px] leading-none">
                {done}
              </span>
              <span className="font-mono text-[13px] text-ink-2">
                / {total} done
              </span>
            </span>
            <span className="text-[13px] leading-5 text-ink-2">
              {total === 0
                ? "Plan your day by starting a task."
                : done >= total
                  ? "Everything planned is done."
                  : `${Math.max(total - done, 0)} left on the plan`}
            </span>
          </div>
        </section>

        <section
          aria-label="Then"
          className="tile col-span-2 px-2.5 pt-4 pb-2.5 lg:col-span-4"
        >
          <div className="flex items-baseline justify-between px-2.5 pb-2">
            <span className="eyebrow">Then</span>
            {links.tasks ? (
              <Link
                href={links.tasks}
                className="rounded-xs text-[13px] text-signal hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                All tasks
              </Link>
            ) : null}
          </div>
          {next.length ? (
            <ul>
              {next.map(({ task: item }) => {
                const itemDue = dueLabel(item.dueAt);

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="flex h-10 items-center gap-2.5 rounded-xl px-2.5 outline-none hover:bg-hover focus-visible:bg-hover"
                    >
                      <StatusGlyph status={item.status} size={14} decorative />
                      <span className="w-[52px] flex-none font-mono text-xs text-ink-3">
                        {item.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {item.name}
                      </span>
                      {itemDue ? (
                        <span
                          className={cn(
                            "font-mono text-xs whitespace-nowrap",
                            itemDue.late ? "text-danger-text" : "text-ink-2",
                          )}
                          title={itemDue.full}
                        >
                          {itemDue.text}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2.5 py-4 text-[13px] text-ink-3">
              Nothing queued. New tasks land here after your focus task.
            </p>
          )}
        </section>

        <section
          aria-label="Team pulse"
          className="tile col-span-2 px-2.5 pt-4 pb-2.5 lg:col-span-7"
        >
          <div className="flex items-center gap-2.5 px-2.5 pb-2">
            <h2 className="text-[15px] font-semibold">Team pulse</h2>
            <span className="flex-1" />
            {workingNow > 0 ? (
              <span className="flex items-center gap-2 font-mono text-xs text-ink-2">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-status-done motion-safe:animate-[zpulse_2.4s_ease-out_infinite]"
                />
                {workingNow} working now
              </span>
            ) : null}
          </div>
          {pulse.length ? (
            <ul>
              {pulse.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    fresh.has(item.id) && "motion-safe:animate-pulse-in",
                  )}
                >
                  <Link
                    href={item.href ?? "#"}
                    className="flex h-11 items-center gap-3 rounded-xl px-2.5 outline-none hover:bg-hover focus-visible:bg-hover"
                  >
                    <ActorAvatar name={item.actor} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-medium">{item.actor}</span>{" "}
                      <span className="text-ink-2">{item.verb}</span>{" "}
                      {item.taskKey ? (
                        <span className="font-mono text-[13px]">
                          {item.taskKey}
                        </span>
                      ) : null}{" "}
                      <span className="text-ink-2">{item.title}</span>
                    </span>
                    <StatusGlyph
                      status={
                        item.verb === "finished"
                          ? "done"
                          : item.verb === "moved"
                            ? "review"
                            : item.verb === "created"
                              ? "todo"
                              : "in-progress"
                      }
                      size={12}
                      decorative
                    />
                    <span className="w-10 text-right font-mono text-xs text-ink-3">
                      {item.when}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-2 px-2.5 pt-3.5 pb-2.5 text-sm text-ink-2">
              Nobody has moved work yet today.
            </div>
          )}
        </section>

        <section
          aria-label="Last 7 days"
          className="tile col-span-2 flex flex-col gap-3.5 px-5 pt-4 pb-[18px] lg:col-span-5"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">Last 7 days</h2>
            <span className="font-mono text-xs text-ink-2">
              {weekTotal} done
            </span>
          </div>
          <div className="grid flex-1 grid-cols-7 gap-1.5">
            {data.week.map((day, index) => (
              <div
                key={`${day.label}-${index}`}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex flex-1 flex-col-reverse justify-start gap-1">
                  {Array.from({ length: 7 }, (_, dot) => (
                    <span
                      key={dot}
                      className={cn(
                        "size-2.5 rounded-full",
                        dot < day.count ? "bg-status-done" : "bg-hairline",
                      )}
                    />
                  ))}
                </div>
                <span className="font-mono text-[11px] text-ink-2">
                  {day.count}
                </span>
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    index === todayIndex
                      ? "font-semibold text-ink"
                      : "text-ink-3",
                  )}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {recentWork.length ? (
          <>
            <div className="col-span-2 mt-2 flex items-baseline justify-between lg:col-span-12">
              <h2 className="eyebrow">Recent work</h2>
            </div>
            {recentWork.slice(0, 4).map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className={cn(
                  "tile col-span-2 flex min-h-32 flex-col gap-1.5 p-[18px] outline-none hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring sm:col-span-1 lg:col-span-3",
                  workTint[item.kind],
                )}
              >
                <span className="font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
                  {item.kind}
                </span>
                <span className="text-[15px] leading-5 font-semibold">
                  {item.title}
                </span>
                <span className="mt-auto font-mono text-xs text-ink-2">
                  {item.label} · {item.updatedAt}
                </span>
              </Link>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
