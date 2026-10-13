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

import { paths } from "~/src/lib/paths";

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

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect(paths.auth.signIn());
  }

  const sessionWithUser = {
    ...session,
    user: session.user,
  };

  if (!sessionWithUser.user.emailVerified) {
    redirect(paths.auth.verifyEmail(sessionWithUser.user.email));
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  // The organization is the one active in the session. A session without one
  // (for example one created before the user joined an organization) falls
  // back to the user's first organization, which is then made active.
  let organization = organizations.find(
    (item) => item.id === sessionWithUser.session.activeOrganizationId,
  );

  if (!organization) {
    const fallbackOrganization = organizations[0];

    if (!fallbackOrganization) {
      redirect(paths.auth.createOrganization());
    }

    await auth.api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: fallbackOrganization.id },
    });

    organization = fallbackOrganization;
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
