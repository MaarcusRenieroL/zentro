import type { ReactElement, ReactNode } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { Button } from "./shadcn/button";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** Shown in mono so it can be quoted to support. */
  requestId?: string | null;
  action?: ReactNode;
  className?: string;
};

/**
 * Something went wrong. Never shown as an empty list: an error is its own
 * state, with a way to try again.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We could not load this. Try again in a moment.",
  onRetry,
  requestId,
  action,
  className,
}: ErrorStateProps): ReactElement {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-lg border border-hairline bg-danger-subtle/40 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-danger-subtle text-danger-text">
        <TriangleAlertIcon className="size-4" aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl leading-tight text-balance text-ink">
        {title}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-2">{message}</p>
      {requestId ? (
        <p className="mt-2 font-mono text-xs text-ink-3">Request {requestId}</p>
      ) : null}
      <div className="mt-4 flex items-center gap-2">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
