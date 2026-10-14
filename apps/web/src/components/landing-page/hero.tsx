import Link from "next/link";

import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

import { HeroProduct } from "./hero-product";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-canvas px-5 pt-20 pb-24 sm:pt-28">
      <div
        aria-hidden="true"
        className="beams absolute inset-x-0 top-0 -z-10 h-[40rem]"
      />
      <div
        aria-hidden="true"
        className="halo absolute top-24 left-1/2 -z-10 h-[46rem] w-[60rem] -translate-x-1/2"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <Reveal className="flex max-w-4xl flex-col items-center text-center">
          <h1 className="font-display text-[3rem] leading-[1.02] tracking-[-0.04em] text-balance text-ink sm:text-[4.5rem] sm:leading-[72px]">
            The calm way to get work{" "}
            <span className="font-serif-italic tracking-normal">finished</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-ink-2">
            Zentro picks the one task to do next, lets your team see work move,
            and keeps every doc and decision linked to it.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="px-7">
              <Link href={paths.auth.signUp()}>Start free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href={paths.auth.signIn()}>Sign in</Link>
            </Button>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="mt-16 w-full max-w-5xl">
          <HeroProduct />
        </Reveal>
      </div>
    </section>
  );
}
