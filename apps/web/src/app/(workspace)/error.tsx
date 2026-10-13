"use client";

import { paths } from "~/src/lib/paths";
import { Button } from "@zentro/ui/components/shadcn/button";
import { AlertTriangleIcon, HomeIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-6" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load this workspace page. Try again, or return to the
          dashboard.
        </p>

        <div className="mt-6 grid w-full gap-2 sm:flex sm:justify-center">
          <Button onClick={reset}>
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href={paths.dashboard()}>
              <HomeIcon className="size-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
