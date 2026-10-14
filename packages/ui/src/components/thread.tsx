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
  children: ReactNode;
};

export function ThreadItem({
  node,
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
        "before:absolute before:top-6 before:bottom-0 before:left-3 before:w-px before:-translate-x-1/2 before:bg-hairline last:before:hidden",
        className,
      )}
      {...props}
    >
      <span className="relative z-[1] flex size-6 items-start justify-center pt-1.5">
        {node ?? (
          <span
            aria-hidden="true"
            className="size-2 rounded-full border border-border-strong bg-surface"
          />
        )}
      </span>
      <div className="min-w-0 pt-0.5">{children}</div>
    </li>
  );
}
