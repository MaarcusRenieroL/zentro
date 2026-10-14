"use client";

import { useEffect, useState } from "react";

import { DayRing } from "@zentro/ui/components/day-ring";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { TeamPulse, type PulseItem } from "@zentro/ui/components/team-pulse";
import { Tile } from "@zentro/ui/components/tile";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";

const tasks = [
  { key: "ZEN-12", title: "Ship the onboarding emails", project: "Launch" },
  { key: "ZEN-15", title: "Review the pricing page copy", project: "Website" },
];

// One loop: rest, start, work, finish, the next task slides in.
const steps = [1600, 2600, 2400, 1800];

/** The real Today screen, doing its one job on a loop. */
export function HeroProduct() {
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (query.matches) {
      setStep(1);

      return;
    }

    const id = setTimeout(() => {
      if (step === steps.length - 1) {
        setStep(0);
        setRound((value) => value + 1);
      } else {
        setStep((value) => value + 1);
      }
    }, steps[step]);

    return () => clearTimeout(id);
  }, [step]);

  const task = tasks[round % tasks.length]!;
  const running = step === 1;
  const finishing = step === 2 || step === 3;
  const done = finishing ? 3 + (round % 2) : 2 + (round % 2);
  const pulse: PulseItem[] = [
    ...(finishing
      ? [
          {
            id: "f",
            actor: "You",
            verb: "finished" as const,
            taskKey: task.key,
            title: task.title,
            when: "now",
          },
        ]
      : []),
    ...(running || finishing
      ? [
          {
            id: "s",
            actor: "You",
            verb: "started" as const,
            taskKey: task.key,
            title: task.title,
            when: "1m",
          },
        ]
      : []),
    {
      id: "a",
      actor: "Ines",
      verb: "finished",
      taskKey: "ZEN-4",
      title: "Import the CSV",
      when: "6m",
    },
    {
      id: "b",
      actor: "Jon",
      verb: "moved",
      taskKey: "ZEN-9",
      title: "Dark mode polish",
      when: "9m",
    },
  ];

  return (
    <div
      aria-label="Zentro's Today screen, a task being started and finished"
      role="img"
      className="relative overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-(--edge-highlight)"
    >
      <div className="flex h-10 items-center gap-2 border-b border-hairline bg-surface px-4">
        <span className="size-2.5 rounded-full bg-pressed" />
        <span className="size-2.5 rounded-full bg-pressed" />
        <span className="size-2.5 rounded-full bg-pressed" />
        <span className="mx-auto font-mono text-[11px] text-ink-3">
          zentro / today
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Tile hero>
          <div
            key={`${round}`}
            className="flex min-h-64 flex-col justify-between gap-6 motion-safe:animate-fade-up"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <StatusGlyph
                  status={finishing ? "done" : running ? "in-progress" : "todo"}
                  size={18}
                  celebrate={step === 2}
                />
                <TaskKey>{task.key}</TaskKey>
                <span className="text-sm text-ink-2">{task.project}</span>
              </div>
              <p
                className={cn(
                  "font-display text-3xl leading-[1.1] text-balance transition-colors duration-200 sm:text-4xl",
                  finishing
                    ? "text-ink-3 line-through decoration-status-done decoration-2"
                    : "text-ink",
                )}
              >
                {task.title}
              </p>
              <p className="text-sm text-ink-2">Due today.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button size="start" tabIndex={-1}>
                {running ? "Mark done" : finishing ? "Done" : "Start"}
              </Button>
              {running ? (
                <span className="font-mono text-lg text-warning-text tabular-nums">
                  0:00:04
                </span>
              ) : null}
            </div>
          </div>
        </Tile>
        <div className="flex flex-col gap-4">
          <Tile>
            <div className="flex items-center gap-4">
              <DayRing done={done} planned={5} size={84} />
              <p className="text-sm text-ink-2">{done} finished today</p>
            </div>
          </Tile>
          <Tile>
            <TeamPulse
              items={pulse.slice(0, 4)}
              freshIds={new Set(pulse[0] ? [pulse[0].id] : [])}
            />
          </Tile>
        </div>
      </div>
    </div>
  );
}
