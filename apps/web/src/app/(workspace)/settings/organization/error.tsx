"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OrganizationSettingsError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section>
      <div className="flex w-full flex-col gap-6">
        <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-card/40 p-6 text-center">
          <div className="flex max-w-md flex-col items-center">
            <div className="flex size-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-6" />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              Settings failed to load
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t load organization settings. Retry the request to
              continue managing this workspace.
            </p>

            <Button className="mt-6" onClick={reset}>
              <RotateCcwIcon className="size-4" />
              Retry settings
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
