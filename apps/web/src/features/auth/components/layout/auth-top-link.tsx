"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { paths } from "~/src/lib/paths";

// The sentence in the top-right corner offers the neighboring screen.
const links: Record<string, { question: string; label: string; href: string }> =
  {
    "/auth/sign-in": {
      question: "New to Zentro?",
      label: "Create an account",
      href: paths.auth.signUp(),
    },
    "/auth/sign-up": {
      question: "Already have an account?",
      label: "Sign in",
      href: paths.auth.signIn(),
    },
    "/auth/forgot-password": {
      question: "Remembered it?",
      label: "Sign in",
      href: paths.auth.signIn(),
    },
    "/auth/verify-email": {
      question: "Wrong email?",
      label: "Change it",
      href: paths.auth.signUp(),
    },
    "/auth/join-organization": {
      question: "Starting fresh?",
      label: "Create an organization",
      href: paths.auth.createOrganization(),
    },
  };

export function AuthTopLink() {
  const pathname = usePathname();
  const entry = pathname.startsWith("/auth/invite/")
    ? {
        question: "Not you?",
        label: "Sign in with another account",
        href: paths.auth.signIn(),
      }
    : links[pathname];

  if (!entry) return <div className="h-5" />;

  return (
    <p className="flex justify-end gap-1.5 text-[13px] text-ink-3">
      <span>{entry.question}</span>
      <Link
        href={entry.href}
        className="rounded-xs text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {entry.label}
      </Link>
    </p>
  );
}
