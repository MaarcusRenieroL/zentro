import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

import { ProductMock } from "./product-mock";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-16 pb-12 sm:pt-24">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[46rem] bg-radial-[ellipse_70%_60%_at_50%_0%] from-signal/20 via-info/8 to-transparent"
      />

      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1 text-xs font-medium text-ink-2 shadow-sm ring-1 ring-hairline/60">
            <span className="rounded-full bg-signal px-2 py-0.5 text-on-signal">
              New
            </span>
            Roles and an audit log that go all the way down
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-7 font-display text-[2.75rem] leading-[0.98] text-balance text-ink sm:text-7xl">
            One workspace for the work, and who can touch it
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-ink-2 sm:text-xl">
            Projects, tasks and docs in one place. Give people exactly the
            access they need, turn on only the modules you use, and see every
            change in the audit log.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full px-6 text-base"
            >
              <Link href={paths.auth.signUp()}>
                Start for free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 rounded-full px-6 text-base"
            >
              <Link href={paths.auth.signIn()}>Sign in</Link>
            </Button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.25} className="mx-auto mt-14 max-w-5xl">
        <ProductMock />
      </Reveal>
    </section>
  );
}
