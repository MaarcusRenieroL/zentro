"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      <div className="flex min-h-[420px] w-full items-center justify-center rounded-md border border-dashed bg-card/40 p-6 text-center">
        <div className="flex max-w-md flex-col items-center">
          <div className="flex size-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Dashboard failed to load
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The workspace overview could not be loaded. Retry the dashboard
            request.
          </p>

          <Button className="mt-6" onClick={reset}>
            <RotateCcwIcon className="size-4" />
            Retry dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}
