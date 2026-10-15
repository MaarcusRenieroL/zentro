import { paths } from "~/src/lib/paths";

export const AuthFooter = () => {
  return (
    <footer className="flex gap-4 text-xs text-ink-3">
      <span>&copy; {new Date().getFullYear()} Zentro</span>
      <a
        href={paths.statusPage}
        target="_blank"
        rel="noreferrer"
        className="rounded-xs underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Status
      </a>
    </footer>
  );
};
