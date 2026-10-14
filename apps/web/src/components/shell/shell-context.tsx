"use client";

import { createContext, useContext } from "react";

type ShellContext = {
  /** Remounts the current page so client-fetched data loads again. */
  refreshPage: () => void;
};

export const ShellContext = createContext<ShellContext>({
  refreshPage: () => undefined,
});

export function useShell() {
  return useContext(ShellContext);
}
