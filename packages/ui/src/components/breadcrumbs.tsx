import {
  Fragment,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "./shadcn/skeleton";

export type BreadcrumbEntry = {
  label: string;
  href?: string;
  /** Render in mono (task keys, ids). */
  mono?: boolean;
  /** Still resolving a real name: shows a skeleton. */
  loading?: boolean;
};

type Props = {
  items: BreadcrumbEntry[];
  LinkComponent: ComponentType<{
    href: string;
    children: ReactNode;
    className?: string;
  }>;
  className?: string;
};

/** A quiet path. The last entry is the current page and is not a link. */
export function Breadcrumbs({
  items,
  LinkComponent,
  className,
}: Props): ReactElement {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-ink-2">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          const content = item.loading ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            <span className={cn("truncate", item.mono && "font-mono")}>
              {item.label}
            </span>
          );

          return (
            <Fragment key={`${item.href ?? item.label}-${index}`}>
              <li
                className={cn("flex min-w-0 items-center", last && "text-ink")}
              >
                {item.href && !last ? (
                  <LinkComponent
                    href={item.href}
                    className="max-w-[16ch] truncate rounded-sm hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {content}
                  </LinkComponent>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="max-w-[24ch] truncate"
                  >
                    {content}
                  </span>
                )}
              </li>
              {last ? null : (
                <li aria-hidden="true" className="text-ink-disabled">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
