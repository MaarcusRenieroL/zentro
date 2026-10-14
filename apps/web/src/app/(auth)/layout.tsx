import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@zentro/ui/components/logo";

import { AuthShowcase } from "~/src/features/auth/components/layout/auth-showcase";
import { AuthFooter } from "~/src/features/auth/components/layout/auth-footer";
import { paths } from "~/src/lib/paths";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or create your Zentro account.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <aside className="relative isolate hidden overflow-hidden border-r border-hairline bg-surface p-12 lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="halo absolute top-1/2 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2"
        />
        <Link href={paths.home()} aria-label="Zentro home" className="w-fit">
          <Logo />
        </Link>

        <div className="my-auto flex flex-col gap-10">
          <h2 className="max-w-md font-display text-5xl leading-[1.05] text-balance text-ink">
            Know what to do{" "}
            <span className="font-serif-italic text-[1.12em]">next</span>
          </h2>
          <AuthShowcase />
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
