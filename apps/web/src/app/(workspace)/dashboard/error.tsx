"use client";

import { useEffect } from "react";

import { ErrorState } from "@zentro/ui/components/error-state";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      className="mt-6"
      title="The dashboard could not be loaded"
      message="Your workspace is fine; we just could not read it right now."
      requestId={error.digest}
      onRetry={reset}
    />
  );
}
