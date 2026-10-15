import Link from "next/link";

import { paths } from "~/src/lib/paths";

const linkClass =
  "rounded-xs underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export const AuthFooter = () => {
  return (
    <footer className="flex gap-4 text-xs text-ink-3">
      <span>&copy; {new Date().getFullYear()} Zentro</span>
      <Link href="/privacy" className={linkClass}>
        Privacy
      </Link>
      <Link href="/terms" className={linkClass}>
        Terms
      </Link>
      <a
        href={paths.statusPage}
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        Status
      </a>
    </footer>
  );
};
