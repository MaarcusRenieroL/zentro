import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@zentro/auth";
import {
  getAuthAppUrl,
  getOrgAppUrl,
  resolveOrgAppFromHost,
} from "@zentro/utils";

function isLocalTasksRedirect(url: URL) {
  return (
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.port === "3002" &&
    (url.pathname === "/" ||
      url.pathname === "/tasks" ||
      url.pathname.startsWith("/tasks/") ||
      url.pathname.startsWith("/projects/"))
  );
}

function normalizeLocalTasksRedirect(url: URL) {
  if (isLocalTasksRedirect(url) && url.pathname === "/") {
    url.pathname = "/tasks";
  }

  return url;
}

function getSafeOrgAppRedirect(value: string | null): URL | null {
  if (!value) {
    return null;
  }

  try {
    const destination = new URL(value);
    const resolvedApp = resolveOrgAppFromHost(destination.host);

    if (!resolvedApp && !isLocalTasksRedirect(destination)) {
      return null;
    }

    return normalizeLocalTasksRedirect(destination);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestHeaders = await headers();
  const requestedRedirect = getSafeOrgAppRedirect(
    request.nextUrl.searchParams.get("redirectTo"),
  );

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

  if (requestedRedirect) {
    const resolvedApp = resolveOrgAppFromHost(requestedRedirect.host);
    const requestedOrganization = resolvedApp
      ? organizations.find(
          (organization) => organization.slug === resolvedApp.orgSlug,
        )
      : activeOrganization;

    if (requestedOrganization) {
      await auth.api.setActiveOrganization({
        headers: requestHeaders,
        body: {
          organizationId: requestedOrganization.id,
        },
      });

      return NextResponse.json({
        redirectTo: requestedRedirect.toString(),
        sessionToken: session.session.token,
      });
    }
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
