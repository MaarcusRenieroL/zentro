"use client";

import { FC, useId } from "react";

import { AccountNav } from "@zentro/ui/components/account-nav";
import { authClient } from "@zentro/auth/client";
import { useState } from "react";
import { OrgSwitcher } from "@zentro/ui/components/org-switcher";
import { Input } from "@zentro/ui/components/shadcn/input";
import { HelpCircleIcon, SearchIcon } from "lucide-react";
import { Button } from "@zentro/ui/components/shadcn/button";
import { NotificationPopover } from "@zentro/ui/components/notification-popover";

const authenticatorUrl =
  process.env.NEXT_PUBLIC_AUTHENTICATOR_URL ?? "http://localhost:3001";

type Props = {
  orgSlug: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    href: string;
  }[];
  user: {
    email: string;
    name: string;
  };
};

export const DashboardNavbar: FC<Props> = ({
  orgSlug,
  organizations,
  user,
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const id = useId();

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      await fetch("/api/session-bridge", { method: "DELETE" });
      window.location.assign(`${authenticatorUrl}/auth/sign-in`);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:flex-none">
          <OrgSwitcher organizations={organizations} activeOrgSlug={orgSlug} />
        </div>

        <div className="order-3 w-full lg:order-none lg:max-w-md">
          <div className="relative">
            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
              <SearchIcon className="size-4" />
              <span className="sr-only">Search</span>
            </div>
            <Input
              id={id}
              type="search"
              placeholder="Search..."
              className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50">
              <kbd className="text-muted-foreground bg-accent inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                ⌘k
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <NotificationPopover />

          <Button
            variant="secondary"
            className="hidden rounded-full sm:inline-flex"
            size="icon-lg"
          >
            <HelpCircleIcon className="h-4 w-4" />
          </Button>

          <AccountNav
            user={user}
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
          />
        </div>
      </nav>
    </header>
  );
};
