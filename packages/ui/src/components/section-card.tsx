import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

type SectionCardProps = Omit<ComponentProps<"section">, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Remove the inner padding (for tables and lists that run edge to edge). */
  flush?: boolean;
};

/** A titled block of a page: one hairline box, header, body. */
export function SectionCard({
  title,
  description,
  actions,
  flush = false,
  className,
  children,
  ...props
}: SectionCardProps): ReactElement {
  return (
    <section
      data-slot="section-card"
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-card shadow-(--edge-highlight)",
        className,
      )}
      {...props}
    >
      {title || actions ? (
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-(--card-pad) py-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-ink-2">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn(!flush && "p-(--card-pad)")}>{children}</div>
    </section>
  );
}
