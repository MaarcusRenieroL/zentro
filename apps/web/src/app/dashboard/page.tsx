import { JSX } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";
import { getAuthAppUrl } from "@zentro/utils";

export default async function DashboardPage(): Promise<JSX.Element> {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect(getAuthAppUrl({ path: "/auth/sign-in" }));
  }

  if (!session.user.emailVerified) {
    redirect(
      getAuthAppUrl({
        path: `/auth/verify-email?email=${encodeURIComponent(session.user.email)}`,
      }),
    );
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const organization = organizations[0];

  if (!organization) {
    redirect(getAuthAppUrl({ path: "/auth/create-organization" }));
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {organization.name}
        </h1>
      </div>
      <p>Workspace dashboard</p>
    </section>
  );
}
