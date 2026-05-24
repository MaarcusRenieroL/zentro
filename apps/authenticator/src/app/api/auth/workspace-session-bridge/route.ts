import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@zentro/auth";
import { getAuthAppUrl, resolveOrgAppFromHost } from "@zentro/utils";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getRedirectPath(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

function getSafeWorkspaceRedirect(value: string | null): URL | null {
  if (!value) {
    return null;
  }

  try {
    const destination = new URL(value);
    const resolvedApp = resolveOrgAppFromHost(destination.host);

    if (!resolvedApp || resolvedApp.app !== "workspace") {
      return null;
    }

    return destination;
  } catch {
    return null;
  }
}

function renderBridgeForm({
  redirectTo,
  sessionToken,
}: {
  redirectTo: URL;
  sessionToken: string;
}) {
  const bridgeUrl = new URL("/api/session-bridge", redirectTo.origin);

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Redirecting...</title>
  </head>
  <body>
    <form method="post" action="${escapeHtml(bridgeUrl.toString())}">
      <input type="hidden" name="token" value="${escapeHtml(sessionToken)}" />
      <input type="hidden" name="redirectTo" value="${escapeHtml(getRedirectPath(redirectTo))}" />
      <noscript>
        <button type="submit">Continue</button>
      </noscript>
    </form>
    <script>
      document.forms[0].submit();
    </script>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const requestHeaders = await headers();
  const redirectTo = getSafeWorkspaceRedirect(
    request.nextUrl.searchParams.get("redirectTo"),
  );

  if (!redirectTo) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/sign-in" })),
    );
  }

  const resolvedApp = resolveOrgAppFromHost(redirectTo.host);
  const session = await auth.api.getSession({ headers: requestHeaders });

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
    headers: requestHeaders,
  });
  const organization = organizations.find(
    (org) => org.slug === resolvedApp?.orgSlug,
  );

  if (!organization) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/create-organization" })),
    );
  }

  await auth.api.setActiveOrganization({
    headers: requestHeaders,
    body: {
      organizationId: organization.id,
    },
  });

  return renderBridgeForm({
    redirectTo,
    sessionToken: session.session.token,
  });
}
