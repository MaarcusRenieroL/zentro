import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";

export default function Loading() {
  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Skeleton className="size-12 shrink-0 rounded-md sm:size-14" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-64 max-w-full sm:h-9" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>

        <div className="-mx-4 overflow-hidden border-b px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 pb-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-24 shrink-0" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-6"
            >
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48 max-w-full" />
                </div>
                <div className="max-w-xl space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
