import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@zentro/auth";

const protectedRoutes = [
  "/auth/create-organization",
  "/auth/join-organization",
  "/auth/invite",
];

export async function proxy(request: NextRequest) {
  const signInUrl = new URL("/auth/sign-in", request.url);
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(signInUrl);
  }

  if (!isProtectedRoute || session.user) {
    return NextResponse.next();
  }

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
