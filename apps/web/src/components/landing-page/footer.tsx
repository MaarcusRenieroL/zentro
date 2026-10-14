import Link from "next/link";

import { Logo } from "@zentro/ui/components/logo";

import { paths } from "~/src/lib/paths";

import { landingModules, moduleGroups } from "./modules";

export function LandingFooter() {
  return (
    <footer className="bg-surface px-5 pt-16 pb-10">
      <div className="mx-auto grid max-w-6xl gap-12 border-t border-hairline pt-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-ink-2">
            One connected workspace for a startup: work, knowledge, conversation
            and the company itself.
          </p>
          <div className="mt-5 flex gap-4 text-sm">
            <Link
              href={paths.auth.signIn()}
              className="text-ink-2 hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href={paths.auth.signUp()}
              className="text-ink-2 hover:text-ink"
            >
              Create an account
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {moduleGroups.map((group) => (
            <nav key={group} aria-label={group}>
              <a
                href={`#modules-${group.toLowerCase()}`}
                className="text-sm font-semibold text-ink"
              >
                {group}
              </a>
              <ul className="mt-3 space-y-2">
                {landingModules
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <li key={item.name}>
                      <a
                        href={`#modules-${group.toLowerCase()}`}
                        className="text-sm text-ink-2 hover:text-ink"
                      >
                        {item.name}
                        {item.live ? null : (
                          <span className="ml-1.5 font-mono text-[10px] text-ink-3">
                            soon
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
