import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@zentro/auth";

import { paths } from "~/src/lib/paths";

// Invitation links stay open to users who already belong to an organization.
const onboardingRoute = "/auth/join-organization";

function isOnboardingRoute(pathname: string) {
  return (
    pathname === onboardingRoute || pathname.startsWith(`${onboardingRoute}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const signInUrl = new URL(paths.auth.signIn(), request.url);

    // Invite links come back to the invitation after signing in.
    if (pathname.startsWith("/auth/invite/")) {
      signInUrl.searchParams.set("redirectTo", pathname);
    }

    return NextResponse.redirect(signInUrl);
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(
      new URL(paths.auth.verifyEmail(session.user.email), request.url),
    );
  }

  if (isOnboardingRoute(pathname)) {
    const organizations = await auth.api.listOrganizations({
      headers: request.headers,
    });

    if (organizations.length > 0) {
      return NextResponse.redirect(new URL(paths.dashboard(), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/docs/:path*",
    "/tasks/:path*",
    "/module-disabled",
    "/auth/create-organization/:path*",
    "/auth/join-organization/:path*",
    "/auth/invite/:path*",
  ],
};
