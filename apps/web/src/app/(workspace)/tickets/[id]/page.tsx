import type { Metadata } from "next";

import { TicketDetail } from "~/src/components/tickets/ticket-detail";

export const metadata: Metadata = { title: "Ticket" };

export default async function TicketPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  return <TicketDetail id={id} />;
}
