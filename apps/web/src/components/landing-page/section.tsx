import type { ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

import { Reveal } from "./reveal";

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 px-4 py-20 sm:py-28", className)}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-signal uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-balance text-ink sm:text-6xl">
            {title}
          </h2>
          {lead ? (
            <p className="mt-5 text-lg text-pretty text-ink-2">{lead}</p>
          ) : null}
        </Reveal>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}
