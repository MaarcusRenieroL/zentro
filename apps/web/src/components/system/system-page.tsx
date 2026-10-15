import type { ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

type SystemPageProps = {
  /** Mono eyebrow: "404 · /tasks/ZEN-99". */
  eyebrow: string;
  /** Serif italic headline. */
  title: string;
  description?: ReactNode;
  /** A tile or list between the body and the actions. */
  children?: ReactNode;
  /** Mono request ID chip. */
  requestId?: string;
  actions?: ReactNode;
  footnote?: ReactNode;
  className?: string;
};

/**
 * The one layout for 404, 403, 500, offline, maintenance and module-off: a
 * centered 600px column, a serif headline, and one clear way forward.
 */
export function SystemPage({
  eyebrow,
  title,
  description,
  children,
  requestId,
  actions,
  footnote,
  className,
}: SystemPageProps) {
  return (
    <div
      data-slot="system-page"
      className={cn("flex justify-center pt-10 pb-10 sm:pt-[72px]", className)}
    >
      <div className="flex w-full max-w-[600px] flex-col gap-3.5">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-serif-italic text-[2.5rem] leading-[1.05] tracking-[-0.01em] text-balance sm:text-[3.5rem] sm:leading-[3.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-base leading-6 text-ink-2">{description}</p>
        ) : null}
        {children}
        {requestId ? (
          <span className="self-start rounded-md border border-hairline px-2.5 py-2.5 font-mono text-xs text-ink-3">
            {requestId}
          </span>
        ) : null}
        {actions ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
        {footnote ? <p className="text-xs text-ink-3">{footnote}</p> : null}
      </div>
    </div>
  );
}
