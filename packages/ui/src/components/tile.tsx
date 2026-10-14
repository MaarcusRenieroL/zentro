import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

export type TileTint = "projects" | "tasks" | "docs" | "teams" | "audit";

const tintBackground: Record<TileTint, string> = {
  projects: "bg-tint-projects",
  tasks: "bg-tint-tasks",
  docs: "bg-tint-docs",
  teams: "bg-tint-teams",
  audit: "bg-tint-audit",
};

type TileProps = Omit<ComponentProps<"section">, "title"> & {
  /** A module tint colors the header band and icon chip, nothing else. */
  tint?: TileTint;
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** The larger radius, for the one focus tile of a screen. */
  hero?: boolean;
  /** Remove the body padding (tables and lists that run edge to edge). */
  flush?: boolean;
};

/**
 * A bento tile: hairline border, big radius, optional pastel header band with a
 * white icon chip. Never nest a tile inside a tile; lists inside are rows.
 */
export function Tile({
  tint,
  icon,
  title,
  description,
  actions,
  hero = false,
  flush = false,
  className,
  children,
  ...props
}: TileProps): ReactElement {
  const hasHeader = Boolean(title || actions || icon);

  return (
    <section
      data-slot="tile"
      data-tint={tint}
      className={cn(
        "tile flex flex-col overflow-hidden",
        hero && "tile-hero",
        className,
      )}
      {...props}
    >
      {hasHeader ? (
        <header
          className={cn(
            "flex items-center gap-3 px-(--pad-tile) py-3.5",
            tint ? tintBackground[tint] : "border-b border-hairline",
          )}
        >
          {icon ? <TintChip>{icon}</TintChip> : null}
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="truncate text-sm font-semibold tracking-tight text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="truncate text-xs text-ink-2">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 flex-1", !flush && "p-(--pad-tile)")}>
        {children}
      </div>
    </section>
  );
}

/** A square icon chip: white on light tints, a lifted surface in dark. */
export function TintChip({
  className,
  ...props
}: ComponentProps<"span">): ReactElement {
  return (
    <span
      data-slot="tint-chip"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-tint-chip text-ink [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
