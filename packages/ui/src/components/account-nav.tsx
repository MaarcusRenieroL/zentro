"use client";

import { FC } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@zentro/ui/shadcn/dropdown-menu";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Users, Building2, Settings, LogOut } from "lucide-react";

type Props = {
  user: {
    name: string;
    email: string;
  };
  onSignOut: () => void | Promise<void>;
  isSigningOut?: boolean;
};

export const AccountNav: FC<Props> = ({
  user,
  onSignOut,
  isSigningOut = false,
}) => {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-secondary text-xs">
            {initials || user.email.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings/members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage members
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Account settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          disabled={isSigningOut}
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
