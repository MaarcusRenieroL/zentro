import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/auth/create-organization",
  "/auth/join-organization",
  "/auth/invite",
];

function hasSessionCookie(request: NextRequest) {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute || hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/auth/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", pathname);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/auth/create-organization/:path*",
    "/auth/join-organization/:path*",
    "/auth/invite/:path*",
  ],
};
