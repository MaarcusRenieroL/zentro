"use client";

import { SearchIcon } from "lucide-react";

import { Kbd } from "@zentro/ui/components/kbd";
import { Button } from "@zentro/ui/shadcn/button";

export const OPEN_PALETTE_EVENT = "zentro:open-palette";

/** Opens the command palette from anywhere inside the shell. */
export function OpenPaletteButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
    >
      <SearchIcon />
      Search
      <Kbd className="ml-1">⌘K</Kbd>
    </Button>
  );
}
