"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@zentro/ui/components/logo";
import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function minutesLabel(minutes: number) {
  if (minutes <= 1) return "Back in about a minute.";

  return `Back in about ${minutes} minutes.`;
}

export function MaintenanceView({
  start,
  end,
}: {
  start: number;
  end: number;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());

    const tick = setInterval(() => setNow(Date.now()), 15_000);

    return () => clearInterval(tick);
  }, []);

  // When the window ends, check quietly for the app and reload into it.
  useEffect(() => {
    if (now === null || now < end) return;

    const poll = setInterval(async () => {
      try {
        const response = await fetch(paths.auth.signIn(), { method: "HEAD" });

        if (response.ok) window.location.assign(paths.home());
      } catch {
        // Still down; keep waiting.
      }
    }, 20_000);

    return () => clearInterval(poll);
  }, [now, end]);

  const startDate = new Date(start);
  const zone =
    new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(startDate)
      .find((part) => part.type === "timeZoneName")?.value ?? "";
  const day = startDate
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  const current = now ?? start;
  const progress = Math.min(
    100,
    Math.max(0, ((current - start) / (end - start)) * 100),
  );
  const remaining = Math.max(0, Math.ceil((end - current) / 60_000));
  const started = current >= start;

  return (
    <main className="flex min-h-screen flex-col bg-canvas px-6 py-7 text-ink sm:px-10">
      <Logo />
      <div className="mx-auto my-auto flex w-full max-w-[560px] flex-col gap-4 py-10">
        <p className="eyebrow">
          SCHEDULED MAINTENANCE · {day} · {clock(start)}–{clock(end)} {zone}
        </p>
        <h1 className="font-serif-italic text-[3rem] leading-none tracking-[-0.01em] text-balance sm:text-[4rem]">
          {remaining > 0 ? minutesLabel(remaining) : "Just a little longer."}
        </h1>
        <p className="max-w-[500px] text-base leading-6 text-ink-2">
          We’re upgrading the database behind your tasks and docs. Nothing is
          lost, and everything saved before {clock(start)} is safe.
        </p>
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-hairline bg-surface px-[18px] py-4">
          <div className="flex font-mono text-xs text-ink-2">
            <span>
              {clock(start)} {started ? "started" : "starts"}
            </span>
            <span className="flex-1" />
            <span>{clock(end)} expected</span>
          </div>
          <div
            role="progressbar"
            aria-label="Maintenance progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="h-1.5 overflow-hidden rounded-full bg-sunken"
          >
            <div className="h-full bg-ink" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-ink-3">
            This page reloads on its own when Zentro is back.
          </p>
        </div>
        <div className="mt-1 flex gap-2">
          <Button variant="outline" asChild>
            <Link href={paths.statusPage} target="_blank" rel="noreferrer">
              Open status page
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
