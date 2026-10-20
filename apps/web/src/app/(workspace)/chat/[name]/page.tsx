import type { Metadata } from "next";
import { Suspense } from "react";

import { ChannelView } from "~/src/components/chat/channel-view";

export const metadata: Metadata = { title: "Chat" };

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  return (
    <Suspense>
      <ChannelView key={name} name={decodeURIComponent(name)} />
    </Suspense>
  );
}
