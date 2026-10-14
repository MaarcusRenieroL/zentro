"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Logo } from "@zentro/ui/components/logo";
import { Button } from "@zentro/ui/shadcn/button";
import { cn } from "@zentro/ui/lib/utils";

import { paths } from "~/src/lib/paths";

const storageKey = "zentro-landing-theme";

const links = [
  { label: "Today", href: "#today" },
  { label: "Team", href: "#team" },
  { label: "Thread", href: "#thread" },
  { label: "Control", href: "#control" },
];

/**
 * The landing page is dark whatever the system says, with its own switch. The
 * wrapper carries the theme class, so the app tokens do the rest.
 */
export function LandingShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);

      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // Storage can be blocked; the default is fine.
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";

    setTheme(next);

    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Not remembered, still switched.
    }
  };

  return (
    <div
      className={cn(
        theme === "dark" ? "dark" : "light",
        "min-h-screen bg-canvas text-ink",
      )}
    >
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={paths.home()} aria-label="Zentro home">
            <Logo />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:bg-hover hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              onClick={toggle}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={paths.auth.signIn()}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href={paths.auth.signUp()}>Start free</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
