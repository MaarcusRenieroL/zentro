import * as React from "react";

import { cn } from "@zentro/ui/lib/utils";

function Table({
  className,
  stickyFirstColumn = false,
  ...props
}: React.ComponentProps<"table"> & {
  /** Keeps the first column visible while the table scrolls sideways. */
  stickyFirstColumn?: boolean;
}) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto overscroll-x-contain"
    >
      <table
        data-slot="table"
        data-sticky-first={stickyFirstColumn || undefined}
        className={cn(
          "w-full caption-bottom text-sm data-[sticky-first]:[&_td:first-child]:sticky data-[sticky-first]:[&_td:first-child]:left-0 data-[sticky-first]:[&_td:first-child]:z-[1] data-[sticky-first]:[&_td:first-child]:bg-surface data-[sticky-first]:[&_th:first-child]:sticky data-[sticky-first]:[&_th:first-child]:left-0 data-[sticky-first]:[&_th:first-child]:z-[2] data-[sticky-first]:[&_th:first-child]:bg-surface",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "sticky top-0 z-[1] bg-sunken/70 [&_tr]:border-b [&_tr]:border-hairline/50",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-sunken font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-(--row-table) border-b border-hairline/50 transition-colors hover:bg-hover has-aria-expanded:bg-hover data-[state=selected]:bg-selected",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-(--row-table) px-3 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-ink-3 uppercase [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-1 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
