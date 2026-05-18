import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@zentro/auth";
import {
  getAuthAppUrl,
  getOrgAppUrl,
  resolveOrgAppFromHost,
} from "@zentro/utils";

export async function proxy(request: NextRequest) {
  const resolvedApp = resolveOrgAppFromHost(request.headers.get("host") ?? "");

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/sign-in" })),
    );
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(
      new URL(
        getAuthAppUrl({
          path: `/auth/verify-email?email=${encodeURIComponent(session.user.email)}`,
        }),
      ),
    );
  }

  const organizations = await auth.api.listOrganizations({
    headers: request.headers,
  });

  const firstOrganization = organizations[0];

  if (!firstOrganization) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/create-organization" })),
    );
  }

  if (!resolvedApp || resolvedApp.app !== "workspace") {
    return NextResponse.redirect(
      new URL(
        getOrgAppUrl({
          orgSlug: firstOrganization.slug,
          app: "workspace",
          path: request.nextUrl.pathname,
        }),
      ),
    );
  }

  const organization = organizations.find(
    (org) => org.slug === resolvedApp.orgSlug,
  );

  if (!organization) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/create-organization" })),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
