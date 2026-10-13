"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@zentro/auth/client";
import { toastError } from "@zentro/ui/index";
import { DashboardNavbar as BaseDashboardNavbar } from "@zentro/ui/components/dashboard-navbar";

import { paths } from "~/src/lib/paths";

type Props = {
  orgSlug: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
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
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      window.location.assign(paths.auth.signIn());
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    const { error } = await authClient.organization.setActive({
      organizationId,
    });

    if (error) {
      toastError(error, "Could not switch organization");
      return;
    }

    router.push(paths.dashboard());
    router.refresh();
  };

  return (
    <BaseDashboardNavbar
      activeOrgSlug={orgSlug}
      organizations={organizations}
      createOrganizationHref={createOrganizationHref}
      onSwitchOrganization={handleSwitchOrganization}
      user={user}
      pathname={pathname}
      LinkComponent={Link}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
    />
  );
};
