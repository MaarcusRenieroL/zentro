import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";
import { loadEnabledModules, loadPermissionSnapshot } from "@zentro/api/server";
import { db } from "@zentro/db";
import { and, eq, isNull } from "@zentro/db/drizzle";
import { projects } from "@zentro/db/schema";
import type { ModuleId } from "@zentro/modules";
import {
  can as engineCan,
  getCatalogKeys,
  reachablePermissions,
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
      // Reachable, not just held organization-wide: a role on one project or
      // team is enough to open the area it covers.
      isAllowed: context.reachable[permission] ?? false,
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

  const projectList = await db
    .select({
      id: projects.id,
      teamId: projects.teamId,
      visibility: projects.visibility,
    })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, organization.id),
        isNull(projects.deletedAt),
      ),
    );
  // Which permissions the user holds anywhere, for navigation and route guards.
  const reachable = reachablePermissions(
    snapshot,
    projectList,
    getCatalogKeys(),
  );

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
    reachable,
    snapshot,
    can: (key: string, resource?: ResourceContext) =>
      engineCan(snapshot, key, resource),
  };
});

/**
 * Whether the user can reach a module's pages at all: the permission is held
 * organization-wide or through a role on a project or team.
 */
export async function getModuleAccess(permission: string) {
  const { reachable } = await getDashboardContext();

  return reachable[permission] ?? false;
}

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
