import Link from "next/link";

import { Logo } from "@zentro/ui/components/logo";

import { paths } from "~/src/lib/paths";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Today", href: "#today" },
      { label: "Team", href: "#team" },
      { label: "Thread", href: "#thread" },
      { label: "Roles and audit", href: "#control" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: paths.auth.signIn() },
      { label: "Create an account", href: paths.auth.signUp() },
      { label: "Forgot password", href: paths.auth.forgotPassword() },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-surface px-5 pb-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 border-t border-hairline pt-12 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-ink-2">
            Projects, tasks and docs in one workspace, with roles and an audit
            log that go all the way down.
          </p>
        </div>
        <div className="flex gap-16">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-semibold text-ink">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-2 hover:text-ink"
                    >
                      {link.label}
                    </Link>
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
