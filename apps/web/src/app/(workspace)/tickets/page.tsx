import type { Metadata } from "next";

import { TicketQueue } from "~/src/components/tickets/ticket-queue";
import { getModuleAccess } from "~/src/lib/dashboard-context";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage() {
  return <TicketQueue canCreate={await getModuleAccess("tickets.create")} />;
}
