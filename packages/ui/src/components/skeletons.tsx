import type { ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";
import { Skeleton } from "./shadcn/skeleton";

/**
 * Skeletons that match the real layouts: same header, rows, columns and cards,
 * so nothing shifts when the data arrives.
 */

export function HeaderSkeleton({
  actions = true,
}: {
  actions?: boolean;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {actions ? <Skeleton className="h-(--control-h) w-28" /> : null}
    </div>
  );
}

export function ToolbarSkeleton(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-(--control-h) w-64 max-w-full" />
      <Skeleton className="h-(--control-h) w-32" />
      <Skeleton className="h-(--control-h) w-32" />
    </div>
  );
}

export function ListSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}): ReactElement {
  return (
    <div
      aria-busy="true"
      className={cn(
        "divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-card",
        className,
      )}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex h-(--row-list) items-center gap-3 px-3"
        >
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3.5 w-1/3 max-w-full" />
          <Skeleton className="ml-auto h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}): ReactElement {
  return (
    <div
      aria-busy="true"
      className="overflow-hidden rounded-lg border border-hairline bg-card"
    >
      <div className="flex h-(--row-table) items-center gap-6 border-b border-hairline px-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex h-(--row-table) items-center gap-6 border-b border-hairline px-3 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, column) => (
            <Skeleton
              key={column}
              className={cn("h-3.5", column === 0 ? "w-40" : "w-20")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  cards = 6,
  className,
}: {
  cards?: number;
  className?: string;
}): ReactElement {
  return (
    <div
      aria-busy="true"
      className={cn(
        "grid gap-(--gap) sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-lg border border-hairline bg-card p-(--card-pad)"
        >
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton({
  columns = 5,
}: {
  columns?: number;
}): ReactElement {
  return (
    <div aria-busy="true" className="flex gap-3 overflow-hidden">
      {Array.from({ length: columns }).map((_, column) => (
        <div
          key={column}
          className="w-64 shrink-0 space-y-2 rounded-lg bg-sunken p-2"
        >
          <div className="flex items-center gap-2 px-1 pt-1">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          {Array.from({ length: 3 - (column % 2) }).map((_, card) => (
            <div
              key={card}
              className="space-y-2 rounded-md border border-hairline bg-card p-2.5"
            >
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="size-4" />
                <Skeleton className="size-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton(): ReactElement {
  return (
    <div
      aria-busy="true"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="space-y-5">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({
  fields = 4,
}: {
  fields?: number;
}): ReactElement {
  return (
    <div
      aria-busy="true"
      className="space-y-5 rounded-lg border border-hairline bg-card p-(--card-pad)"
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-(--control-h) w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}

/** A page: header, toolbar and a body skeleton of your choice. */
export function PageSkeleton({
  children,
  toolbar = false,
  actions = true,
}: {
  children: React.ReactNode;
  toolbar?: boolean;
  actions?: boolean;
}): ReactElement {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <HeaderSkeleton actions={actions} />
      {toolbar ? <ToolbarSkeleton /> : null}
      {children}
    </div>
  );
}
