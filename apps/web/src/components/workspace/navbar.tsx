"use client";

import { FC, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircleIcon, PlusIcon, SearchIcon } from "lucide-react";

import { authClient } from "@zentro/auth/client";
import { AccountNav } from "@zentro/ui/components/account-nav";
import { DynamicBreadcrumb } from "@zentro/ui/components/dynamic-breadcrumb";
import { NotificationPopover } from "@zentro/ui/components/notification-popover";
import { OrgSwitcher } from "@zentro/ui/components/org-switcher";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Input } from "@zentro/ui/components/shadcn/input";
import { SidebarTrigger } from "@zentro/ui/components/shadcn/sidebar";

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
  createOrganizationHref: string;
  user: {
    email: string;
    name: string;
  };
};

export const DashboardNavbar: FC<Props> = ({
  orgSlug,
  organizations,
  createOrganizationHref,
  user,
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
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
      <nav className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 py-2 sm:px-6 max-md:flex max-md:flex-wrap max-md:justify-between">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden justify-self-start">
          <SidebarTrigger />

          <OrgSwitcher
            organizations={organizations}
            activeOrgSlug={orgSlug}
            createOrganizationHref={createOrganizationHref}
          />

          <div className="hidden min-w-0 flex-1 overflow-hidden md:block">
            <DynamicBreadcrumb
              pathname={pathname}
              LinkComponent={Link}
              maxItems={3}
            />
          </div>
        </div>

        <div className="hidden min-w-0 items-center justify-center gap-2 md:flex">
          <div className="relative w-72 lg:w-80 xl:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-muted-foreground peer-disabled:opacity-50">
              <SearchIcon className="size-4" />
              <span className="sr-only">Search</span>
            </div>

            <Input
              id={id}
              type="search"
              placeholder="Search..."
              className="peer h-9 px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50">
              <kbd className="inline-flex h-5 max-h-full items-center rounded border bg-accent px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground">
                ⌘k
              </kbd>
            </div>
          </div>

          <Button type="button" size="sm" className="shrink-0">
            <PlusIcon className="size-4" />
            Create
          </Button>
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 justify-self-end sm:gap-4">
          <Button
            className="rounded-full md:hidden"
            variant="secondary"
            size="icon-lg"
          >
            <SearchIcon />
            <span className="sr-only">Search</span>
          </Button>

          <Button
            className="rounded-full md:hidden"
            variant="default"
            size="icon-lg"
          >
            <PlusIcon />
            <span className="sr-only">Create</span>
          </Button>

          <NotificationPopover />

          <Button
            variant="secondary"
            className="hidden rounded-full sm:inline-flex"
            size="icon-lg"
          >
            <HelpCircleIcon className="h-4 w-4" />
            <span className="sr-only">Help</span>
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
