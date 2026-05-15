import { Loader2 } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  showLabel?: boolean;
};

export function LoadingState({
  label = "Loading...",
  className,
  showLabel = true,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {showLabel ? (
        <span>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}
