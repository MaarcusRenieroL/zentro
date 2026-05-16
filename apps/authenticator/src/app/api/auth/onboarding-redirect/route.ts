import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@zentro/auth";

export async function GET() {
  const requestHeaders = await headers();

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

  const firstOrganization = organizations[0];

  if (!firstOrganization) {
    return NextResponse.json({
      redirectTo: "/auth/create-organization",
    });
  }

  return NextResponse.json({
    redirectTo: `http://${firstOrganization.slug}.localhost:3000/dashboard`,
  });
}
