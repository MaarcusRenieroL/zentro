import { cn } from "@zentro/ui/lib/utils";

/** A quiet placeholder. The pulse is removed under reduced motion. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-sunken motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
