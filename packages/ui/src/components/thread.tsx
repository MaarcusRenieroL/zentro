import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

/**
 * The connection thread: a 1px vertical line with a node (a dot or an avatar)
 * for each entry. It is the shared look of every timeline: activity feeds,
 * comments and event detail.
 */
export function Thread({
  className,
  ...props
}: ComponentProps<"ol">): ReactElement {
  return (
    <ol
      data-slot="thread"
      className={cn("relative flex flex-col", className)}
      {...props}
    />
  );
}

type ThreadItemProps = Omit<ComponentProps<"li">, "children"> & {
  /** An avatar, icon or leave empty for a plain dot. */
  node?: ReactNode;
  /** The item in view: an accent node with a soft glow. */
  active?: boolean;
  children: ReactNode;
};

export function ThreadItem({
  node,
  active = false,
  className,
  children,
  ...props
}: ThreadItemProps): ReactElement {
  return (
    <li
      data-slot="thread-item"
      className={cn(
        "relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 pb-(--gap) last:pb-0",
        // The line runs from under this node to the next one.
        "before:absolute before:top-6 before:bottom-0 before:left-3 before:w-px before:-translate-x-1/2 before:bg-line-strong last:before:hidden",
        className,
      )}
      {...props}
    >
      <span className="relative z-[1] flex size-6 items-start justify-center pt-1.5">
        {node ?? <ThreadNode active={active} />}
      </span>
      <div className="min-w-0 pt-0.5">{children}</div>
    </li>
  );
}

/** The dot on the line. Only the live one glows. */
export function ThreadNode({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
}): ReactElement {
  return (
    <span
      aria-hidden="true"
      data-active={active || undefined}
      className={cn(
        "size-2.5 rounded-full border bg-surface",
        active
          ? "border-signal bg-signal shadow-[0_0_0_4px_var(--signal-subtle),0_0_14px_var(--focus-ring)]"
          : "border-line-strong",
        className,
      )}
    />
  );
}
