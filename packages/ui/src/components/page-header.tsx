import type { ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Breadcrumbs or a back link above the title. */
  breadcrumbs?: ReactNode;
  /** Buttons on the right. */
  actions?: ReactNode;
  /** Small things beside the title (a key chip, a status). */
  meta?: ReactNode;
  className?: string;
};

/** The top of every page: a serif title, a line of context, and the actions. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
}: PageHeaderProps): ReactElement {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-3", className)}
    >
      {breadcrumbs ? <div className="min-w-0">{breadcrumbs}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-display text-(length:--title-size) leading-[1.1] font-normal tracking-tight text-balance text-ink">
              {title}
            </h1>
            {meta}
          </div>
          {description ? (
            <p className="max-w-2xl text-sm text-ink-2">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
