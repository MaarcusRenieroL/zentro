import { JSX } from "react";
import { DashboardNavbar } from "~/src/components/dashboard/navbar";

import { getOrgAppUrl } from "@zentro/utils";

import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  const { organization, organizations, session } = await getDashboardContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNavbar
        orgSlug={organization.slug}
        organizations={organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          href: getOrgAppUrl({
            orgSlug: org.slug,
            app: "workspace",
            path: "/dashboard",
          }),
        }))}
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
      <main>{children}</main>
    </div>
  );
}
