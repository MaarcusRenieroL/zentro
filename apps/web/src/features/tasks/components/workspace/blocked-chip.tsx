import { cn } from "@zentro/ui/lib/utils";

/** "Blocked" when open tasks block this one; the keys are in the tooltip. */
export function BlockedChip({
  blockedBy,
  className,
}: {
  blockedBy: string[];
  className?: string;
}) {
  if (!blockedBy.length) return null;

  const label = `Blocked by ${blockedBy.join(", ")}`;

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-danger/40 bg-danger-subtle px-1.5 py-px font-mono text-[11px] text-danger-text",
        className,
      )}
    >
      Blocked
    </span>
  );
}
