import { Skeleton } from "@zentro/ui/shadcn/skeleton";

export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-[720px] flex-col gap-4 py-6"
      aria-busy="true"
    >
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
