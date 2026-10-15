import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MaintenanceView } from "./maintenance-view";

export const metadata: Metadata = { title: "Maintenance" };

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

// The scheduled window comes from the link ops share (?from=…&to=… as ISO
// times). With no valid window there is nothing to announce.
export default async function MaintenancePage({ searchParams }: Props) {
  const { from, to } = await searchParams;
  const start = from ? Date.parse(from) : NaN;
  const end = to ? Date.parse(to) : NaN;

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    redirect("/");
  }

  return <MaintenanceView start={start} end={end} />;
}
