"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDotIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

import { OpenPaletteButton } from "./open-palette-button";
import { SystemPage } from "./system-page";

/** 404. `inShell` adds the palette search, which only exists in the app. */
export function NotFoundContent({ inShell = false }: { inShell?: boolean }) {
  const pathname = usePathname();

  return (
    <SystemPage
      eyebrow={`404 · ${pathname}`}
      title="We can’t find that page."
      description="That page doesn’t exist, or it was moved or deleted. Check the link, or jump to somewhere you know."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href={inShell ? paths.dashboard() : paths.home()}>
              <CircleDotIcon />
              {inShell ? "Go to Today" : "Go home"}
            </Link>
          </Button>
          {inShell ? <OpenPaletteButton /> : null}
        </>
      }
      footnote="If someone sent you this link, ask them to check it."
    />
  );
}
