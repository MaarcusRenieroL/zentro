import type { Metadata } from "next";
import { Suspense } from "react";

import { ChannelView } from "~/src/components/chat/channel-view";

export const metadata: Metadata = { title: "Direct message" };

export default async function DmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense>
      <ChannelView key={id} id={id} />
    </Suspense>
  );
}
