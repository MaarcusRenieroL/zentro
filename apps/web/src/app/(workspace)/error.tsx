"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@zentro/ui/components/error-state";
import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkspaceError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      className="mt-10"
      title="This page could not be loaded"
      message="Something went wrong while loading it. Try again, or go back to the dashboard."
      requestId={error.digest}
      onRetry={reset}
      action={
        <Button variant="ghost" asChild>
          <Link href={paths.dashboard()}>Dashboard</Link>
        </Button>
      }
    />
  );
}
