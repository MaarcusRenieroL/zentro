import { Button } from "@zentro/ui/components/shadcn/button";
import { ArrowLeftIcon, HomeIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-md border bg-card text-lg font-semibold shadow-sm">
          404
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>

        <div className="mt-6 grid w-full gap-2 sm:flex sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <LayoutDashboardIcon className="size-4" />
              Dashboard
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/">
              <HomeIcon className="size-4" />
              Home
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="..">
              <ArrowLeftIcon className="size-4" />
              Go back
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
