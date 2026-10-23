import type { Metadata } from "next";

import { BoardList } from "~/src/components/whiteboards/board-list";

export const metadata: Metadata = { title: "Whiteboards" };

export default function WhiteboardsPage() {
  return <BoardList />;
}
