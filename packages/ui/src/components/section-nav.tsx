"use client";

import {
  useRef,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@zentro/ui/lib/utils";
import { useActiveBox } from "@zentro/ui/lib/use-active-box";

export type SectionNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
};

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-current"?: "page" | undefined;
};

type SectionNavProps = {
  items: SectionNavItem[];
  /** The href of the active item (the page decides; nothing is guessed here). */
  activeHref: string | null;
  LinkComponent: ComponentType<LinkProps>;
  orientation?: "horizontal" | "vertical";
  /** Visible heading for a vertical nav group. */
  label?: string;
  className?: string;
};

/**
 * Page-level secondary navigation. The active item gets one indicator that
 * glides between items.
 */
export function SectionNav({
  items,
  activeHref,
  LinkComponent,
  orientation = "horizontal",
  label,
  className,
}: SectionNavProps): ReactElement {
  const ref = useRef<HTMLElement>(null);
  const box = useActiveBox(ref, '[aria-current="page"]');
  const vertical = orientation === "vertical";

  return (
    <nav
      ref={ref}
      aria-label={label ?? "Section"}
      data-slot="section-nav"
      className={cn(
        "relative flex",
        vertical
          ? "flex-col gap-0.5"
          : "gap-1 overflow-x-auto border-b border-hairline [scrollbar-width:none]",
        className,
      )}
    >
      {box ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-0 transition-[transform,width,height] duration-[var(--duration-base)] ease-[var(--ease-out)]",
            vertical
              ? "rounded-md bg-selected"
              : "h-0.5 rounded-full bg-primary",
          )}
          style={{
            width: box.width,
            height: vertical ? box.height : 2,
            transform: `translate(${box.left}px, ${
              vertical ? box.top : box.top + box.height - 2
            }px)`,
          }}
        />
      ) : null}
      {items.map((item) => {
        const active = item.href === activeHref;

        return (
          <LinkComponent
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative z-[1] flex shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] hover:text-ink focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
              vertical
                ? "h-(--nav-item) rounded-md px-2.5"
                : "h-[calc(var(--control-h)+6px)] px-2.5",
              active ? "text-ink" : "text-ink-2",
            )}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
            {item.badge}
          </LinkComponent>
        );
      })}
    </nav>
  );
}
