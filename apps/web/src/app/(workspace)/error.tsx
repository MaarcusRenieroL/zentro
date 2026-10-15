"use client";

import { useEffect } from "react";

import { ServerErrorContent } from "~/src/components/system/server-error-content";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkspaceError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ServerErrorContent requestId={error.digest} onRetry={reset} />;
}
