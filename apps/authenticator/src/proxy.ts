import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@zentro/auth";

const onboardingRoutes = [
  "/auth/create-organization",
  "/auth/join-organization",
  "/auth/invite",
];

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
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (!session.user.emailVerified) {
    const verifyEmailUrl = new URL("/auth/verify-email", request.url);
    verifyEmailUrl.searchParams.set("email", session.user.email);

    return NextResponse.redirect(verifyEmailUrl);
  }

  const organizations = await auth.api.listOrganizations({
    headers: request.headers,
  });

  const firstOrganization = organizations[0];

  if (!firstOrganization) {
    return NextResponse.next();
  }

  if (isRoute(pathname, onboardingRoutes)) {
    return NextResponse.redirect(
      new URL(`http://${firstOrganization.slug}.localhost:3000/dashboard`),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/create-organization/:path*",
    "/auth/join-organization/:path*",
    "/auth/invite/:path*",
  ],
};
