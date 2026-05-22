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

  return NextResponse.json({
    sessionToken: session.session.token,
  });
}
