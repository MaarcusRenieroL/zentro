"use client";

import { useEffect } from "react";

import { ErrorState } from "@zentro/ui/components/error-state";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OrganizationSettingsError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Settings failed to load"
      message="We couldn't load organization settings. Retry the request to continue managing this workspace."
      requestId={error.digest}
      onRetry={reset}
    />
  );
}
