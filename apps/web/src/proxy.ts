import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@zentro/auth";

import { paths } from "~/src/lib/paths";

const onboardingRoutes = ["/auth/join-organization", "/auth/invite"];

function isRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
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

  if (isRoute(pathname, onboardingRoutes)) {
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
    "/auth/create-organization/:path*",
    "/auth/join-organization/:path*",
    "/auth/invite/:path*",
  ],
};
