import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:px-6">
        <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 max-md:flex max-md:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8" />
            <Skeleton className="h-9 w-44" />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Skeleton className="h-9 w-80 lg:w-96" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <Skeleton className="h-10 w-72 max-w-full" />
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-md" />
          ))}
        </div>
      </main>
    </div>
  );
}
