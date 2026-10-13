import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";
import { loadEnabledModules, loadPermissionSnapshot } from "@zentro/api/server";
import { db } from "@zentro/db";
import type { ModuleId } from "@zentro/modules";
import {
  can as engineCan,
  type PermissionSnapshot,
  type ResourceContext,
} from "@zentro/permissions";

import { paths } from "~/src/lib/paths";

const defaultRole = "member";

/** Booleans the settings screens read; each one is a permission check. */
function toPermissionFlags(snapshot: PermissionSnapshot) {
  const has = (key: string) => engineCan(snapshot, key);

  return {
    canUpdateOrganization: has("org.settings.update"),
    canDeleteOrganization: has("org.delete"),
    canInviteMembers: has("members.invite"),
    canRemoveMembers: has("members.remove"),
    canUpdateMemberRoles: has("members.role.update"),
    canCreateProjects: has("projects.create"),
    canUpdateProjects: has("projects.update"),
    canArchiveProjects: has("projects.archive"),
    canDeleteProjects: has("projects.delete"),
    canCreateDocs: has("docs.create"),
    canUpdateDocs: has("docs.update_any"),
    canDeleteDocs: has("docs.trash_any"),
    canRestoreDocs: has("docs.restore"),
    canCommentOnDocs: has("docs.comment"),
    canCreateTeams: has("teams.create"),
    canUpdateTeams: has("teams.update"),
    canDeleteTeams: has("teams.delete"),
    canManageTeamMembers: has("teams.members.manage"),
  };
}

export async function getAuthorizedDashboardContext(permission: string) {
  const context = await getDashboardContext();

  return {
    ...context,
    authorization: {
      isAllowed: context.can(permission),
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

  const snapshot = await loadPermissionSnapshot(
    db,
    organization.id,
    sessionWithUser.user.id,
  );
  const role = snapshot.baseRole ?? defaultRole;

  const enabledModules = [
    ...(await loadEnabledModules(db, organization.id)),
  ] as ModuleId[];

  return {
    organization,
    organizations,
    enabledModules,
    roles: {
      user: sessionWithUser.user.role ?? defaultRole,
      organization: role,
    },
    session: sessionWithUser,
    permissions: toPermissionFlags(snapshot),
    snapshot,
    can: (key: string, resource?: ResourceContext) =>
      engineCan(snapshot, key, resource),
  };
});

/**
 * Route guard for toggleable modules. A turned-off module never renders; the
 * caller is sent to a short explanation instead.
 */
export async function requireModule(moduleId: ModuleId) {
  const { enabledModules } = await getDashboardContext();

  if (!enabledModules.includes(moduleId)) {
    redirect(paths.moduleDisabled(moduleId));
  }
}
