import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chat" };

// The channel list lives in the layout; on desktop this is the empty pane.
export default function ChatPage() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-2 px-6 text-center md:flex">
      <p className="eyebrow">Chat</p>
      <h2 className="font-serif-italic text-[2rem] leading-10">
        Pick a conversation.
      </h2>
      <p className="max-w-sm text-[15px] text-ink-2">
        Choose a channel or message from the list, or start a new one.
      </p>
    </div>
  );
}
