import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="px-4 pb-20">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center sm:py-24">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-radial-[ellipse_60%_80%_at_50%_120%] from-signal/70 to-transparent"
          />
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.02] text-balance text-ink-inverse sm:text-6xl">
            Bring the work, the people and the rules together
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-inverse/70">
            Create an organization in a minute. Invite your team when you are
            ready.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-9 h-11 rounded-full bg-surface px-6 text-base text-ink shadow-none hover:bg-sunken"
          >
            <Link href={paths.auth.signUp()}>
              Start for free
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
