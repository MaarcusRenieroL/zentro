import type { ReactElement, ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

/** Nothing here yet: a serif line, one sentence, and the primary action. */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps): ReactElement {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-sunken text-ink-2">
        {icon ?? <Inbox className="size-4" aria-hidden="true" />}
      </div>
      <h2 className="font-serif-italic text-[2.5rem] leading-none text-balance text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-ink-2">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
