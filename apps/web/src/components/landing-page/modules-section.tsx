import Link from "next/link";

import { Tile } from "@zentro/ui/components/tile";
import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

import { landingModules, moduleGroups, replaces } from "./modules";
import { Reveal } from "./reveal";

/** Every module, grouped. What exists is full strength; what is planned is dim. */
export function ModulesSection() {
  return (
    <section
      id="modules"
      className="scroll-mt-16 border-y border-hairline bg-surface px-5 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance text-ink sm:text-5xl">
            One workspace, not{" "}
            <span className="font-serif-italic tracking-normal">ten tools</span>
          </h2>
          <p className="mt-5 text-lg text-pretty text-ink-2">
            Zentro is the operating system for a startup: work, knowledge,
            conversation and the company itself in one connected place. Some of
            it is live today; the rest is marked as coming.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col gap-14">
          {moduleGroups.map((group) => {
            const items = landingModules.filter((item) => item.group === group);

            return (
              <Reveal key={group}>
                <div
                  id={`modules-${group.toLowerCase()}`}
                  className="scroll-mt-24"
                >
                  <h3 className="eyebrow mb-4">{group}</h3>
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {items.map((item) => {
                      const tile = (
                        <Tile
                          tint={item.tint}
                          icon={<item.icon aria-hidden="true" />}
                          title={item.name}
                          actions={
                            <span
                              className={cn(
                                "rounded-sm px-2 py-0.5 font-mono text-[11px]",
                                item.live
                                  ? "bg-success-subtle text-success-text"
                                  : "bg-sunken text-ink-3",
                              )}
                            >
                              {item.live ? "Live" : "Coming"}
                            </span>
                          }
                          className={cn(
                            "h-full transition-colors duration-(--duration-fast)",
                            item.live
                              ? "group-hover:border-line-strong"
                              : "opacity-60",
                          )}
                        >
                          <p className="text-sm text-ink-2">{item.line}</p>
                        </Tile>
                      );

                      return (
                        <li key={item.name}>
                          {item.live ? (
                            <Link
                              href={paths.auth.signUp()}
                              aria-label={`${item.name}, live. Start free to use it.`}
                              className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {tile}
                            </Link>
                          ) : (
                            <div
                              aria-label={`${item.name}, coming`}
                              role="group"
                            >
                              {tile}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** What each group replaces, in plain words and without anyone's logo. */
export function ReplacesSection() {
  return (
    <section className="bg-canvas px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {moduleGroups.map((group) => (
              <li key={group} className="border-t border-line-strong pt-5">
                <p className="eyebrow">{group}</p>
                <p className="mt-3 text-base text-ink">{replaces[group]}.</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
