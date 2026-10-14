import { FormSkeleton, TableSkeleton } from "@zentro/ui/components/skeletons";

// The settings frame is already on screen; this stands in for one page.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <FormSkeleton fields={3} />
      <TableSkeleton rows={4} columns={4} />
    </div>
  );
}
