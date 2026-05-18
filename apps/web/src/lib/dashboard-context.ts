import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";
import {
  getAuthAppUrl,
  getOrgAppUrl,
  resolveOrgAppFromHost,
} from "@zentro/utils";

export const getDashboardContext = cache(async () => {
  const requestHeaders = await headers();
  const resolvedApp = resolveOrgAppFromHost(requestHeaders.get("host") ?? "");

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect(getAuthAppUrl({ path: "/auth/sign-in" }));
  }

  if (!session.user.emailVerified) {
    redirect(
      getAuthAppUrl({
        path: `/auth/verify-email?email=${encodeURIComponent(session.user.email)}`,
      }),
    );
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const firstOrganization = organizations[0];

  if (!firstOrganization) {
    redirect(getAuthAppUrl({ path: "/auth/create-organization" }));
  }

  if (!resolvedApp || resolvedApp.app !== "workspace") {
    redirect(
      getOrgAppUrl({
        orgSlug: firstOrganization.slug,
        app: "workspace",
        path: "/dashboard",
      }),
    );
  }

  const organization = organizations.find(
    (org) => org.slug === resolvedApp.orgSlug,
  );

  if (!organization) {
    redirect(getAuthAppUrl({ path: "/auth/create-organization" }));
  }

  return {
    organization,
    organizations,
    session,
  };
});
