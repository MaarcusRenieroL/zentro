import Link from "next/link";

import { Logo } from "@zentro/ui/components/logo";
import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas px-6 py-6 text-ink">
      <Link href="/" aria-label="Zentro home" className="w-fit">
        <Logo />
      </Link>

      <section className="mx-auto my-auto flex w-full max-w-md flex-col items-center text-center">
        <p className="font-mono text-xs text-ink-3">404</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] text-balance">
          This page does not exist
        </h1>
        <p className="mt-3 text-sm text-ink-2">
          The link may be wrong, or the page may have moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={paths.dashboard()}>Go to the dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
