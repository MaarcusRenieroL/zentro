"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@zentro/ui/components/error-state";
import { Logo } from "@zentro/ui/components/logo";
import { Button } from "@zentro/ui/shadcn/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col bg-canvas px-6 py-6">
      <Link href="/" aria-label="Zentro home" className="w-fit">
        <Logo />
      </Link>
      <div className="mx-auto my-auto w-full max-w-md">
        <ErrorState
          requestId={error.digest}
          onRetry={reset}
          action={
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
