import { createHmac } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@zentro/auth";
import { getAuthAppUrl } from "@zentro/utils";

const sessionCookieName = "better-auth.session_token";
const sessionCookieMaxAge = 60 * 60 * 24 * 7;

export const runtime = "nodejs";

function getSessionSecret(): string | null {
  return process.env.BETTER_AUTH_SECRET ?? null;
}

function signSessionToken(token: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(token).digest("base64");

  return encodeURIComponent(`${token}.${signature}`);
}

function getSafeRedirectPath(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function setHostSessionCookie(response: NextResponse, signedToken: string) {
  response.headers.append(
    "Set-Cookie",
    [
      `${sessionCookieName}=${signedToken}`,
      `Max-Age=${sessionCookieMaxAge}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      process.env.NODE_ENV === "production" ? "Secure" : null,
    ]
      .filter(Boolean)
      .join("; "),
  );
}

function clearHostSessionCookie(response: NextResponse) {
  response.headers.append(
    "Set-Cookie",
    [
      `${sessionCookieName}=`,
      "Max-Age=0",
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      process.env.NODE_ENV === "production" ? "Secure" : null,
    ]
      .filter(Boolean)
      .join("; "),
  );
}

async function getSessionFromToken(signedToken: string) {
  const headers = new Headers();
  headers.set("cookie", `${sessionCookieName}=${signedToken}`);

  return auth.api.getSession({ headers });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token");
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));
  const secret = getSessionSecret();

  if (typeof token !== "string" || !token || !secret) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/sign-in" })),
      { status: 303 },
    );
  }

  const signedToken = signSessionToken(token, secret);
  const session = await getSessionFromToken(signedToken);

  if (!session) {
    return NextResponse.redirect(
      new URL(getAuthAppUrl({ path: "/auth/sign-in" })),
      { status: 303 },
    );
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(
      new URL(
        getAuthAppUrl({
          path: `/auth/verify-email?email=${encodeURIComponent(session.user.email)}`,
        }),
      ),
      { status: 303 },
    );
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 303,
  });

  setHostSessionCookie(response, signedToken);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  clearHostSessionCookie(response);

  return response;
}
