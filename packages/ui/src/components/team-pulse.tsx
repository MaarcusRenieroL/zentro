import type { ComponentType, ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";

export type PulseVerb = "started" | "moved" | "finished" | "created";

export type PulseItem = {
  id: string;
  actor: string;
  verb: PulseVerb;
  /** The task key, such as ZEN-9. */
  taskKey?: string;
  title: string;
  href?: string;
  /** Pre-formatted time, such as "2m" or "Tue 14:02". */
  when: string;
};

const verbStatus: Record<PulseVerb, string> = {
  started: "in-progress",
  moved: "review",
  finished: "done",
  created: "todo",
};

const verbText: Record<PulseVerb, string> = {
  started: "started",
  moved: "moved",
  finished: "finished",
  created: "created",
};

type TeamPulseProps = {
  items: PulseItem[];
  /** Ids that arrived since the last render; they slide in. */
  freshIds?: ReadonlySet<string>;
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
  }>;
  empty?: ReactNode;
  className?: string;
};

/** Who started, moved and finished work, with a gently pulsing live dot. */
export function TeamPulse({
  items,
  freshIds,
  LinkComponent,
  empty,
  className,
}: TeamPulseProps): ReactElement {
  const Anchor = LinkComponent ?? "a";

  return (
    <div data-slot="team-pulse" className={cn("flex flex-col", className)}>
      <div className="mb-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-status-done motion-safe:animate-live"
        />
        <span className="eyebrow">Live</span>
      </div>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-ink-2">
          {empty ?? "No movement yet today."}
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => {
            const body = (
              <>
                <StatusGlyph
                  status={verbStatus[item.verb]}
                  size={14}
                  decorative
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-2">
                  <span className="font-medium text-ink">{item.actor}</span>{" "}
                  {verbText[item.verb]}{" "}
                  {item.taskKey ? (
                    <TaskKey className="mr-1">{item.taskKey}</TaskKey>
                  ) : null}
                  <span className="text-ink">{item.title}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-ink-3">
                  {item.when}
                </span>
              </>
            );
            const row =
              "flex h-(--row-h) items-center gap-2.5 rounded-md px-2 -mx-2 transition-colors duration-(--duration-fast) hover:bg-hover";

            return (
              <li
                key={item.id}
                className={cn(
                  freshIds?.has(item.id) && "motion-safe:animate-pulse-in",
                )}
              >
                {item.href ? (
                  <Anchor href={item.href} className={row}>
                    {body}
                  </Anchor>
                ) : (
                  <div className={row}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
