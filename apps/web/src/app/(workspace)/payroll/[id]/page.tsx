import type { Metadata } from "next";

import { RunDetail } from "~/src/components/payroll/run-detail";

export const metadata: Metadata = { title: "Pay run" };

export default async function PayRunPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  return <RunDetail id={id} />;
}
