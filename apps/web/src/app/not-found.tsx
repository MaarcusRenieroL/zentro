import Link from "next/link";

import { Logo } from "@zentro/ui/components/logo";

import { NotFoundContent } from "~/src/components/system/not-found-content";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas px-6 py-6 text-ink">
      <Link href="/" aria-label="Zentro home" className="w-fit">
        <Logo />
      </Link>
      <div className="my-auto">
        <NotFoundContent />
      </div>
    </main>
  );
}
