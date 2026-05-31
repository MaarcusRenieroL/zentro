import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@zentro/auth";
import {
  getAuthAppUrl,
  getOrgAppUrl,
  resolveOrgAppFromHost,
} from "@zentro/utils";

function isLocalhost(host: string) {
  const hostname = host.split(":")[0];

  return hostname === "localhost" || hostname === "127.0.0.1";
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  const host = request.headers.get("host") ?? "";
  const resolvedApp = resolveOrgAppFromHost(host);
  const bridgeUrl = getAuthAppUrl({
    path: `/api/auth/workspace-session-bridge?redirectTo=${encodeURIComponent(
      request.url,
    )}`,
  });

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL(bridgeUrl));
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

  const activeOrganization =
    organizations.find(
      (organization) =>
        organization.id === session.session.activeOrganizationId,
    ) ?? organizations[0];

  if (!activeOrganization) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/create-organization" })),
    );
  }

  if (!resolvedApp && isLocalhost(host)) {
    return NextResponse.next();
  }

  if (!resolvedApp || resolvedApp.app !== "tasks") {
    return NextResponse.redirect(
      new URL(
        getOrgAppUrl({
          orgSlug: activeOrganization.slug,
          app: "tasks",
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
  matcher: ["/", "/tasks/:path*", "/projects/:path*"],
};
