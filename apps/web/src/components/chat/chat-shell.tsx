"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeftIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

import { ChannelList } from "./channel-list";
import { CustomEmojiProvider } from "./custom-emoji";
import {
  BrowseChannelsDialog,
  NewChannelDialog,
  NewDmDialog,
} from "./chat-dialogs";

type Dialog = "channel" | "dm" | "browse" | null;

/** Chat's two columns: your conversations, and the one you're in. */
export function ChatShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [dialog, setDialog] = useState<Dialog>(null);
  // On a phone the list and the conversation are separate screens.
  const onIndex = pathname === "/chat";

  // ⌘⇧F opens message search from anywhere in Chat.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "f"
      ) {
        event.preventDefault();
        window.location.assign("/chat/search");
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CustomEmojiProvider>
      <div className="-mx-4 -mt-5 -mb-12 flex h-[calc(100svh-3.5rem)] min-h-[480px] overflow-hidden border-t border-hairline md:-mx-(--gutter) md:-mt-7 md:-mb-16 md:border-x-0">
        <div
          className={cn(
            "w-full shrink-0 flex-col border-r border-hairline bg-sunken/40 md:flex md:w-[272px]",
            onIndex ? "flex" : "hidden",
          )}
        >
          <ChannelList
            onNewChannel={() => setDialog("channel")}
            onNewDm={() => setDialog("dm")}
            onBrowse={() => setDialog("browse")}
          />
        </div>

        <div
          className={cn(
            "min-w-0 flex-1 flex-col bg-canvas md:flex",
            onIndex ? "hidden" : "flex",
          )}
        >
          <Link
            href="/chat"
            className="flex items-center gap-1 border-b border-hairline px-3 py-2 text-sm text-ink-2 md:hidden"
          >
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Chat
          </Link>
          {children}
        </div>

        {dialog === "channel" ? (
          <NewChannelDialog onClose={() => setDialog(null)} />
        ) : null}
        {dialog === "dm" ? (
          <NewDmDialog onClose={() => setDialog(null)} />
        ) : null}
        {dialog === "browse" ? (
          <BrowseChannelsDialog onClose={() => setDialog(null)} />
        ) : null}
      </div>
    </CustomEmojiProvider>
  );
}
