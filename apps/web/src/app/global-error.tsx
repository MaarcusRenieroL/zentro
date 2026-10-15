"use client";

import "./globals.css";

import { useEffect, useState } from "react";

import { Logo } from "@zentro/ui/components/logo";
import { Button } from "@zentro/ui/shadcn/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * The app failed to boot: the root layout itself is gone, so this renders its
 * own html and body, with no providers and no theme.
 */
export default function GlobalError({ error, reset }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const details = [
    `${error.name}: ${error.message}`,
    error.digest ? `req_${error.digest}` : null,
    new Date().toISOString(),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink">
        <main className="flex min-h-screen flex-col px-10 py-7">
          <Logo />
          <div className="mx-auto my-auto flex w-full max-w-[560px] flex-col gap-4">
            <p className="eyebrow">SOMETHING WENT WRONG</p>
            <h1 className="font-serif-italic text-[3rem] leading-none tracking-[-0.01em] sm:text-[4rem]">
              Zentro couldn’t start.
            </h1>
            <p className="max-w-[500px] text-base leading-6 text-ink-2">
              Part of the app didn’t load, usually after an update or a dropped
              connection. Reloading fixes it almost every time.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="lg" onClick={() => window.location.reload()}>
                Reload Zentro
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  void navigator.clipboard?.writeText(details).then(() => {
                    setCopied(true);
                  });
                }}
              >
                {copied ? "Copied" : "Copy error details"}
              </Button>
              <Button variant="ghost" size="lg" onClick={reset}>
                Try without reloading
              </Button>
            </div>
            <pre className="mt-2 overflow-x-auto rounded-md border border-hairline bg-surface px-4 py-3.5 font-mono text-xs leading-5 whitespace-pre-wrap text-ink-2">
              {details}
            </pre>
          </div>
        </main>
      </body>
    </html>
  );
}
