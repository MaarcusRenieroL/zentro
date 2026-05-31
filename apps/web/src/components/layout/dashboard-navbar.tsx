"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@zentro/auth/client";
import { DashboardNavbar as BaseDashboardNavbar } from "@zentro/ui/components/dashboard-navbar";

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
    <BaseDashboardNavbar
      activeOrgSlug={orgSlug}
      organizations={organizations}
      createOrganizationHref={createOrganizationHref}
      user={user}
      pathname={pathname}
      LinkComponent={Link}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
    />
  );
};
