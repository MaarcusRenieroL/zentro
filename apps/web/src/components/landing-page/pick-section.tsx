"use client";

import { useState } from "react";

import { Tile } from "@zentro/ui/components/tile";
import { Switch } from "@zentro/ui/shadcn/switch";

import { Reveal } from "./reveal";

const initial = { projects: true, tasks: true, docs: true };

const rows = [
  { id: "projects", name: "Projects", needs: null },
  { id: "tasks", name: "Tasks", needs: "projects" },
  { id: "docs", name: "Docs", needs: null },
] as const;

/** Organizations choose their modules; a module that needs another says so. */
export function PickSection() {
  const [on, setOn] = useState<Record<string, boolean>>(initial);

  const reason = (id: (typeof rows)[number]["id"]) => {
    if (id === "projects" && on.tasks) return "Turn off Tasks first.";
    if (id === "tasks") return "Needs Projects.";

    return null;
  };
  const locked = (id: (typeof rows)[number]["id"]) =>
    (id === "projects" && on.tasks) || (id === "tasks" && !on.projects);

  return (
    <section className="border-y border-hairline bg-surface px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Reveal>
          <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance text-ink sm:text-5xl">
            Pick only what you{" "}
            <span className="font-serif-italic tracking-normal">use</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg text-pretty text-ink-2">
            Each organization turns modules on and off. Turning one off hides it
            and keeps its data. A module that depends on another tells you why
            it cannot be switched yet.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="grid gap-4 sm:grid-cols-3">
            {rows.map((row) => {
              const note = reason(row.id);

              return (
                <Tile
                  key={row.id}
                  title={row.name}
                  tint={
                    row.id === "docs"
                      ? "docs"
                      : row.id === "tasks"
                        ? "tasks"
                        : "projects"
                  }
                  actions={
                    <Switch
                      aria-label={`${row.name} module`}
                      checked={on[row.id]}
                      disabled={locked(row.id)}
                      onCheckedChange={(value) =>
                        setOn((current) => ({ ...current, [row.id]: value }))
                      }
                    />
                  }
                  className={on[row.id] ? "" : "opacity-60"}
                >
                  <p className="min-h-10 text-sm text-ink-2">
                    {note ??
                      (on[row.id] ? "On for everyone." : "Off. Data kept.")}
                  </p>
                </Tile>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
