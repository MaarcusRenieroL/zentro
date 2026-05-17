import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@zentro/auth";
import { getAuthAppUrl } from "@zentro/utils";

export async function proxy(request: NextRequest) {
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

  if (!organizations[0]) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/create-organization" })),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
