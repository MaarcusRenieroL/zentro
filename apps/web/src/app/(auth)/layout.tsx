import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@zentro/ui/components/logo";

import { AuthFooter } from "~/src/features/auth/components/layout/auth-footer";
import { AuthShowcase } from "~/src/features/auth/components/layout/auth-showcase";
import { AuthTopLink } from "~/src/features/auth/components/layout/auth-top-link";
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
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[46%_minmax(0,1fr)]">
      <aside className="hidden flex-col border-r border-hairline bg-sunken px-10 py-7 lg:flex">
        <Link href={paths.home()} aria-label="Zentro home" className="w-fit">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <AuthShowcase />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col px-5 py-6 sm:px-10 sm:py-7">
        <header className="flex items-center justify-between gap-4 lg:justify-end">
          <Link
            href={paths.home()}
            aria-label="Zentro home"
            className="w-fit lg:hidden"
          >
            <Logo />
          </Link>
          <AuthTopLink />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        <AuthFooter />
      </div>
    </div>
  );
}
