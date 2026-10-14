import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Logo } from "@zentro/ui/components/logo";

import { AuthFooter } from "~/src/features/auth/components/layout/auth-footer";
import { paths } from "~/src/lib/paths";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or create your Zentro account.",
};

const points = [
  "Projects, tasks and docs in one workspace",
  "Roles you can build, down to a single project",
  "An audit log of every change",
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-ink p-12 text-ink-inverse lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-radial-[ellipse_80%_60%_at_20%_100%] from-signal/60 to-transparent"
        />
        <Link href={paths.home()} aria-label="Zentro home" className="w-fit">
          <Logo className="text-ink-inverse" markClassName="text-ink-inverse" />
        </Link>

        <div className="my-auto max-w-md">
          <h2 className="font-display text-5xl leading-[1.02] text-balance">
            The work, the people and the rules, together
          </h2>
          <ul className="mt-10 space-y-4">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-ink-inverse/80"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-inverse/15">
                  <CheckIcon className="size-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="px-5 pt-5 lg:hidden">
          <Link href={paths.home()} aria-label="Zentro home" className="w-fit">
            <Logo />
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md [&>*]:max-w-none">{children}</div>
        </main>
        <AuthFooter />
      </div>
    </div>
  );
}
