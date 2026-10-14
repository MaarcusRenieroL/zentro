import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";

export function ProjectPageLoading() {
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-hairline/60">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-56 max-w-full" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl bg-surface shadow-sm ring-1 ring-hairline/60 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <div className="flex gap-5 border-b pb-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-20" />
            ))}
          </div>
          <div className="rounded-3xl bg-surface shadow-sm ring-1 ring-hairline/60 p-5">
            <Skeleton className="mb-5 h-5 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl bg-surface shadow-sm ring-1 ring-hairline/60 p-5"
            >
              <Skeleton className="mb-5 h-5 w-36" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

export function ProjectSettingsLoading() {
  return (
    <section>
      <div className="flex w-full flex-col gap-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Skeleton className="size-12 shrink-0 rounded-md sm:size-14" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-64 max-w-full sm:h-9" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="hidden h-5 w-28 sm:block" />
        </div>

        <div className="-mx-4 overflow-hidden border-b px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 pb-3 sm:gap-6">
            <Skeleton className="h-5 w-24 shrink-0" />
            <Skeleton className="h-5 w-32 shrink-0" />
          </div>
        </div>

        <ProjectSettingsContentLoading />
      </div>
    </section>
  );
}

export function ProjectSettingsContentLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="max-w-xl space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className={index === 2 ? "h-28 w-full" : "h-10 w-full"} />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        ))}
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl bg-surface shadow-sm ring-1 ring-hairline/60 p-5">
          <Skeleton className="mb-4 h-5 w-24" />
          <Skeleton className="mb-4 size-10 rounded-md" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-28" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>
        <div className="rounded-3xl bg-surface shadow-sm ring-1 ring-hairline/60 p-5">
          <Skeleton className="mb-4 h-5 w-28" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </aside>
    </div>
  );
}
