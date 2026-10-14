import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";

function StatPillSkeleton() {
  return (
    <div className="flex h-11 min-w-0 items-center gap-2 rounded-md border bg-card/70 px-3 shadow-sm sm:px-4">
      <Skeleton className="size-4 shrink-0" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function ListCardSkeleton({
  rows,
  className,
}: {
  rows: number;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="size-4 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64 sm:h-9 sm:w-80 lg:h-10" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-wrap xl:items-center">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatPillSkeleton key={index} />
            ))}
          </div>
        </div>

        <div className="w-full rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
          <Skeleton className="h-4 w-36" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-md border bg-background/60 p-3"
              >
                <Skeleton className="size-5 shrink-0" />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid w-full gap-5 lg:grid-cols-2 xl:grid-cols-7">
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
          <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-11 rounded-md" />
              ))}
            </div>
          </section>

          <section className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-md" />
              ))}
            </div>
          </section>
        </div>

        <ListCardSkeleton
          rows={6}
          className="h-full rounded-md border bg-card/50 p-4 shadow-sm sm:p-5 lg:col-span-2 xl:col-span-3"
        />

        <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
          <ListCardSkeleton
            rows={4}
            className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5"
          />
          <ListCardSkeleton
            rows={4}
            className="rounded-md border bg-card/50 p-4 shadow-sm sm:p-5"
          />
        </div>
      </div>
    </section>
  );
}
