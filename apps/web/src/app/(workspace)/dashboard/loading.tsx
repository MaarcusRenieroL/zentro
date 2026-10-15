import { Skeleton } from "@zentro/ui/shadcn/skeleton";

// Mirrors the Today bento: focus tile, two side tiles, four recent tiles.
export default function Loading() {
  return (
    <div aria-busy="true" role="status">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-2.5 w-72 max-w-full" />
        <Skeleton className="h-[30px] w-96 max-w-full rounded-[10px]" />
      </div>
      <div className="mt-7 grid grid-cols-12 gap-4">
        <div className="col-span-12 flex min-h-[400px] flex-col gap-4 rounded-[28px] border border-hairline bg-surface px-8 py-7 lg:col-span-8 lg:row-span-2">
          <Skeleton className="h-2.5 w-40" />
          <Skeleton className="h-10 w-[78%] rounded-[10px]" />
          <Skeleton className="h-10 w-[54%] rounded-[10px]" />
          <Skeleton className="h-3 w-[62%]" />
          <div className="flex-1" />
          <div className="flex items-end gap-3">
            <Skeleton className="h-10 w-44 rounded-[10px]" />
            <div className="flex-1" />
            <Skeleton className="h-11 w-30 rounded-xl" />
          </div>
        </div>
        {[0, 1].map((tile) => (
          <div
            key={tile}
            className="col-span-12 flex min-h-48 flex-col gap-3 rounded-xl border border-hairline bg-surface px-5 py-[18px] sm:col-span-6 lg:col-span-4"
          >
            <Skeleton className="h-2.5 w-[90px]" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-4/5" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        ))}
        {[0, 1, 2, 3].map((tile) => (
          <div
            key={tile}
            className="col-span-6 flex min-h-32 flex-col gap-3 rounded-xl border border-hairline bg-surface px-5 py-[18px] lg:col-span-3"
          >
            <Skeleton className="h-2 w-[50px]" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2 w-[56%]" />
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-ink-3">Loading your day…</p>
    </div>
  );
}
