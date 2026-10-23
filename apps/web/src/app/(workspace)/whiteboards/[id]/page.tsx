import type { Metadata } from "next";

import { BoardEditor } from "~/src/components/whiteboards/board-editor";

export const metadata: Metadata = { title: "Whiteboard" };

export default async function WhiteboardPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  return <BoardEditor id={id} />;
}
