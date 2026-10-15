"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@zentro/auth/client";
import {
  DensitySegments,
  ThemeSegments,
} from "@zentro/ui/components/appearance";
import { initialsOf } from "@zentro/ui/lib/tone";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";

import { paths } from "~/src/lib/paths";

type Props = {
  user: { name: string; email: string };
  links: { settingsHref: string | null; membersHref: string | null };
};

const item = "h-9 rounded-[10px] px-2.5 text-sm";

/** You, on a lavender chip: the same mark in the top bar and the menu. */
function Initials({ name, size }: { name: string; size: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size >= 32 ? 11 : 10 }}
      className="flex shrink-0 items-center justify-center rounded-full border border-hairline bg-tint-tasks font-mono text-ink"
    >
      {initialsOf(name)}
    </span>
  );
}

/** The account menu: who you are, theme and density, then where you go. */
export function UserMenu({ user, links }: Props) {
  const [signingOut, setSigningOut] = useState(false);
  const name = user.name || user.email;

  const signOut = async () => {
    setSigningOut(true);

    try {
      await authClient.signOut();
      window.location.assign(paths.auth.signIn());
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          data-slot="user-menu"
          className="flex size-8 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring md:size-7"
        >
          <Initials name={name} size={28} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-68 min-w-68 rounded-2xl p-1.5"
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 p-2.5 font-normal">
          <Initials name={name} size={32} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-ink">
              {user.name}
            </span>
            <span className="truncate font-mono text-[11px] text-ink-3">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeSegments />
        <DensitySegments />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={item}>
          <Link href="/settings/account/profile">Profile</Link>
        </DropdownMenuItem>
        {links.settingsHref ? (
          <DropdownMenuItem asChild className={item}>
            <Link href={links.settingsHref}>Settings</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={signingOut}
          onClick={signOut}
          className={`${item} text-ink-2`}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
