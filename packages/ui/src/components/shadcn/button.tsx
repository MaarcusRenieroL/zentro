import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@zentro/ui/lib/utils";
import { Spinner } from "../spinner";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-canvas active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-signal-hover",
        secondary:
          "border-transparent bg-sunken text-ink hover:bg-hover aria-expanded:bg-hover",
        outline:
          "border-line-strong bg-surface text-ink hover:bg-hover aria-expanded:bg-hover",
        ghost:
          "text-ink-2 hover:bg-hover hover:text-ink aria-expanded:bg-hover",
        destructive:
          "border-transparent bg-danger-subtle text-danger-text hover:border-danger/40 focus-visible:ring-danger",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-(--control-h) px-3",
        xs: "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-[calc(var(--control-h)-6px)] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[calc(var(--control-h)+8px)] px-5",
        start: "h-13 px-7 text-base font-semibold",
        icon: "size-(--control-h)",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-[calc(var(--control-h)-6px)]",
        "icon-lg": "size-[calc(var(--control-h)+8px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner and keeps the button's width. */
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : loading ? (
        <>
          <span className="invisible inline-flex items-center gap-1.5">
            {children}
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
