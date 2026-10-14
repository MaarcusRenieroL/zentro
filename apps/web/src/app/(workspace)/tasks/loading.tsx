import { BoardSkeleton, PageSkeleton } from "@zentro/ui/components/skeletons";

export default function Loading() {
  return (
    <PageSkeleton toolbar>
      <BoardSkeleton />
    </PageSkeleton>
  );
}
