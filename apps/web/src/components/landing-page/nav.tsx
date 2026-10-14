"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { Logo } from "@zentro/ui/components/logo";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

const links = [
  { label: "Product", href: "#product" },
  { label: "Permissions", href: "#permissions" },
  { label: "Modules", href: "#modules" },
  { label: "Audit log", href: "#audit" },
  { label: "Roadmap", href: "#roadmap" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-3 pl-5 transition-[background-color,box-shadow] duration-200",
          scrolled || open
            ? "bg-surface/80 shadow-md ring-1 ring-hairline/60 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <Link href={paths.home()} aria-label="Zentro home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href={paths.auth.signIn()}>Sign in</Link>
          </Button>
          <Button asChild className="rounded-full px-4">
            <Link href={paths.auth.signUp()}>Get started</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <XIcon /> : <MenuIcon />}
        </Button>
      </div>

      {open ? (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl bg-surface p-3 shadow-lg ring-1 ring-hairline/60 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-base font-medium text-ink hover:bg-sunken"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 p-1">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <Link href={paths.auth.signIn()}>Sign in</Link>
            </Button>
            <Button asChild size="lg" className="rounded-full">
              <Link href={paths.auth.signUp()}>Get started</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
