"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Logo } from "@zentro/ui/components/logo";

import { ServerErrorContent } from "~/src/components/system/server-error-content";

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
      <div className="my-auto">
        <ServerErrorContent requestId={error.digest} onRetry={reset} />
      </div>
    </main>
  );
}
