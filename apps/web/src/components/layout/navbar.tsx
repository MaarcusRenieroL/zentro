"use client";

import { paths } from "~/src/lib/paths";
import { Button } from "@zentro/ui/shadcn/button";
import Link from "next/link";
import { FC } from "react";

export const Navbar: FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent/60">
            <span className="text-sm font-bold text-accent-foreground">Z</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            zentro
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#solution"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Solution
          </Link>
          <Link
            href="#benefits"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Benefits
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
            asChild
          >
            <Link href={paths.auth.signIn()}>Log in</Link>
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href={paths.auth.signUp()}>Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};
