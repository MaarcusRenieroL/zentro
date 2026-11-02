import type { Metadata } from "next";

import { LeaveBoard } from "~/src/components/hr/leave-board";

export const metadata: Metadata = { title: "Time off" };

export default function LeavePage() {
  return <LeaveBoard />;
}
