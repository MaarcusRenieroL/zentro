import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  auth,
  getOrganizationPermissions,
  hasOrganizationPermission,
  type OrganizationRole,
  type PermissionRequest,
} from "@zentro/auth";
import {
  getAuthAppUrl,
  getOrgAppUrl,
  resolveOrgAppFromHost,
} from "@zentro/utils";

const defaultRole = "member";

export function canAccessOrganizationPermission(
  role: OrganizationRole,
  permission: PermissionRequest,
) {
  return hasOrganizationPermission(role, permission);
}

export async function getAuthorizedDashboardContext(
  permission: PermissionRequest,
) {
  const context = await getDashboardContext();

  return {
    ...context,
    authorization: {
      isAllowed: canAccessOrganizationPermission(
        context.roles.organization,
        permission,
      ),
      permission,
    },
  };
}

export const getDashboardContext = cache(async () => {
  const requestHeaders = await headers();
  const resolvedApp = resolveOrgAppFromHost(requestHeaders.get("host") ?? "");

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect(getAuthAppUrl({ path: "/auth/sign-in" }));
  }

  if (!session.user) {
    redirect(getAuthAppUrl({ path: "/auth/sign-in" }));
  }

  const sessionWithUser = {
    ...session,
    user: session.user,
  };

  if (!sessionWithUser.user.emailVerified) {
    redirect(
      getAuthAppUrl({
        path: `/auth/verify-email?email=${encodeURIComponent(sessionWithUser.user.email)}`,
      }),
    );
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const activeOrganization =
    organizations.find(
      (organization) =>
        organization.id === sessionWithUser.session.activeOrganizationId,
    ) ?? organizations[0];

  if (!activeOrganization) {
    redirect(getAuthAppUrl({ path: "/auth/create-organization" }));
  }

  if (!resolvedApp || resolvedApp.app !== "workspace") {
    redirect(
      getOrgAppUrl({
        orgSlug: activeOrganization.slug,
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

  const organizationRole = await auth.api.getActiveMemberRole({
    headers: requestHeaders,
    query: {
      organizationId: organization.id,
    },
  });

  const role = (organizationRole.role ?? defaultRole) as OrganizationRole;

  return {
    organization,
    organizations,
    roles: {
      user: sessionWithUser.user.role ?? defaultRole,
      organization: role,
    },
    session: sessionWithUser,
    permissions: getOrganizationPermissions(role),
  };
});
