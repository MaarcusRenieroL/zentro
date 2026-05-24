import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@zentro/auth";
import { getAuthAppUrl, getOrgAppUrl } from "@zentro/utils";

export async function GET() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.json({ redirectTo: "/auth/sign-in" }, { status: 401 });
  }

  const user = session.user;

  if (!user.emailVerified) {
    return NextResponse.json({
      redirectTo: `/auth/verify-email?email=${encodeURIComponent(user.email)}`,
    });
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const activeOrganization =
    organizations.find(
      (organization) =>
        organization.id === session.session.activeOrganizationId,
    ) ?? organizations[0];

  if (!activeOrganization) {
    return NextResponse.json({
      redirectTo: getAuthAppUrl({ path: "/auth/create-organization" }),
      sessionToken: session.session.token,
    });
  }

  return NextResponse.json({
    redirectTo: getOrgAppUrl({
      orgSlug: activeOrganization.slug,
      app: "workspace",
      path: "/dashboard",
    }),
    sessionToken: session.session.token,
  });
}
