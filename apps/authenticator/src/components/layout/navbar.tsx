import Link from "next/link";

export const Navbar = () => {
  return (
    <header className="flex h-16 items-center px-6 py-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/60">
          <span className="text-sm font-bold text-primary-foreground">Z</span>
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          zentro
        </span>
      </Link>
    </header>
  );
};
