"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOutIcon, SettingsIcon, UsersIcon } from "lucide-react";

import { authClient } from "@zentro/auth/client";
import {
  DensityMenuItems,
  ThemeMenuItems,
} from "@zentro/ui/components/appearance";
import { initialsOf } from "@zentro/ui/lib/tone";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
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

/** The account menu: where you go, plus the theme and density switches. */
export function UserMenu({ user, links }: Props) {
  const [signingOut, setSigningOut] = useState(false);

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
          className="flex size-9 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar>
            <AvatarFallback seed={user.email}>
              {initialsOf(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 min-w-60">
        <DropdownMenuLabel className="space-y-0.5 font-normal">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-3">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.settingsHref ? (
          <DropdownMenuItem asChild>
            <Link href={links.settingsHref}>
              <SettingsIcon className="size-4" aria-hidden="true" />
              Organization settings
            </Link>
          </DropdownMenuItem>
        ) : null}
        {links.membersHref ? (
          <DropdownMenuItem asChild>
            <Link href={links.membersHref}>
              <UsersIcon className="size-4" aria-hidden="true" />
              Members
            </Link>
          </DropdownMenuItem>
        ) : null}
        {links.settingsHref || links.membersHref ? (
          <DropdownMenuSeparator />
        ) : null}
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <DensityMenuItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onClick={signOut}
          className="text-danger-text focus:text-danger-text"
        >
          <LogOutIcon className="size-4" aria-hidden="true" />
          {signingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
