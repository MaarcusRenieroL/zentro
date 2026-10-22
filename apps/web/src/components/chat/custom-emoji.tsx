"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useTrpcClient } from "@zentro/api/react";

export type CustomEmoji = { name: string; url: string };

const Context = createContext<{
  emoji: Map<string, string>;
  list: CustomEmoji[];
  reload: () => void;
}>({ emoji: new Map(), list: [], reload: () => undefined });

/** A few shortcodes people type from habit; custom emoji sit on top. */
export const builtinShortcodes: Record<string, string> = {
  thumbsup: "👍",
  "+1": "👍",
  thumbsdown: "👎",
  tada: "🎉",
  eyes: "👀",
  fire: "🔥",
  heart: "❤️",
  rocket: "🚀",
  pray: "🙏",
  smile: "😄",
  joy: "😂",
  thinking: "🤔",
  white_check_mark: "✅",
  warning: "⚠️",
  clap: "👏",
  sweat_smile: "😅",
  wave: "👋",
  bug: "🐛",
  sparkles: "✨",
  hourglass: "⏳",
};

/** Loads the organization's custom emoji once for everything below it. */
export function CustomEmojiProvider({ children }: { children: ReactNode }) {
  const trpc = useTrpcClient();
  const [list, setList] = useState<CustomEmoji[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let live = true;

    trpc.chat.emojiList
      .query()
      .then((rows) => live && setList(rows))
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [trpc, version]);

  const value = useMemo(
    () => ({
      emoji: new Map(list.map((entry) => [entry.name, entry.url])),
      list,
      reload: () => setVersion((current) => current + 1),
    }),
    [list],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCustomEmoji() {
  return useContext(Context);
}
