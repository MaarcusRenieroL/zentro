"use client";

import { FC } from "react";

import { AccountNav } from "@zentro/ui/components/account-nav";
import { authClient } from "@zentro/auth/client";
import { useState } from "react";
import { OrgSwitcher } from "@zentro/ui/components/org-switcher";

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
      <nav className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <OrgSwitcher organizations={organizations} activeOrgSlug={orgSlug} />
        </div>

        <div className="flex items-center gap-1">
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
