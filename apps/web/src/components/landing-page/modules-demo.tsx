"use client";

import { useMemo, useState } from "react";
import {
  BookOpenIcon,
  FolderKanbanIcon,
  ListChecksIcon,
  type LucideIcon,
} from "lucide-react";

import { canDisable, canEnable, getModule } from "@zentro/modules";
import { Switch } from "@zentro/ui/shadcn/switch";
import { cn } from "@zentro/ui/lib/utils";

import { Section } from "./section";

const items: Array<{ id: string; icon: LucideIcon }> = [
  { id: "projects", icon: FolderKanbanIcon },
  { id: "tasks", icon: ListChecksIcon },
  { id: "docs", icon: BookOpenIcon },
];

export function ModulesDemo() {
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(["dashboard", "settings", "projects", "tasks", "docs"]),
  );
  const [message, setMessage] = useState<string | null>(null);

  const sidebar = useMemo(
    () =>
      ["dashboard", ...items.map((i) => i.id), "settings"].filter((id) =>
        enabled.has(id),
      ),
    [enabled],
  );

  function toggle(id: string, next: boolean) {
    const check = next ? canEnable(id, enabled) : canDisable(id, enabled);

    if (!check.allowed) {
      setMessage(check.reason ?? null);

      return;
    }

    setMessage(null);
    setEnabled((current) => {
      const updated = new Set(current);

      if (next) updated.add(id);
      else updated.delete(id);

      return updated;
    });
  }

  return (
    <Section
      id="modules"
      eyebrow="Modules"
      title="Turn on only what your team uses"
      lead="Each organization chooses its own modules. Try it: Tasks needs Projects, so Zentro will not let you break that."
    >
      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-hairline/60">
          {items.map(({ id, icon: Icon }) => {
            const manifest = getModule(id);
            const on = enabled.has(id);

            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-sunken"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-signal-subtle text-signal">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {manifest?.name}
                  </p>
                  <p className="truncate text-xs text-ink-2">
                    {manifest?.description}
                  </p>
                </div>
                <Switch
                  checked={on}
                  onCheckedChange={(next) => toggle(id, next)}
                  aria-label={`${manifest?.name} module`}
                />
              </div>
            );
          })}
          <p
            role="status"
            className={cn(
              "mx-3 mt-1 mb-2 min-h-10 rounded-xl px-3 py-2 text-sm",
              message ? "bg-warning-subtle text-warning-text" : "text-ink-3",
            )}
          >
            {message ?? "Dependencies are checked before anything changes."}
          </p>
        </div>

        <div className="rounded-3xl bg-canvas p-3 ring-1 ring-hairline/60">
          <p className="px-3 pt-2 pb-3 text-xs font-medium text-ink-3">
            What your sidebar looks like
          </p>
          <ul className="space-y-1">
            {sidebar.map((id) => (
              <li
                key={id}
                className="rounded-xl bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-xs ring-1 ring-hairline/50"
              >
                {getModule(id)?.name === "Organization settings"
                  ? "Settings"
                  : getModule(id)?.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
