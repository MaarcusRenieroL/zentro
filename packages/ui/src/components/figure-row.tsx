import type { ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

export type Figure = {
  label: string;
  value: ReactNode;
  href?: string;
};

type Props = {
  figures: Figure[];
  /** How a figure that links is rendered (pass your router's Link). */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: ReactNode;
    className?: string;
  }>;
  className?: string;
};

/**
 * One quiet row of figures instead of boxed stat cards: value over label,
 * separated by hairlines.
 */
export function FigureRow({
  figures,
  LinkComponent,
  className,
}: Props): ReactElement {
  return (
    <dl
      data-slot="figure-row"
      className={cn(
        "flex flex-wrap gap-x-0 gap-y-3 divide-x divide-hairline",
        className,
      )}
    >
      {figures.map((figure) => {
        const body = (
          <>
            <dd className="text-xl leading-none font-semibold tracking-tight text-ink">
              {figure.value}
            </dd>
            <dt className="mt-1 text-xs text-ink-2">{figure.label}</dt>
          </>
        );

        return (
          <div key={figure.label} className="px-5 first:pl-0 last:pr-0">
            {figure.href && LinkComponent ? (
              <LinkComponent
                href={figure.href}
                className="block rounded-sm hover:text-signal focus-visible:ring-2 focus-visible:ring-ring"
              >
                {body}
              </LinkComponent>
            ) : (
              body
            )}
          </div>
        );
      })}
    </dl>
  );
}

/** A single figure with a caption, for places that need one number. */
export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "rounded-lg border border-hairline bg-card p-(--card-pad)",
        className,
      )}
    >
      <p className="text-xs text-ink-2">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}
