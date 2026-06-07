import { ReactNode } from "react";
import { ThemeProvider } from "../components/providers/theme-provider";
import { AppTRPCProvider } from "../components/providers/trpc-provider";
import { SidebarInset, SidebarProvider } from "@zentro/ui/shadcn/sidebar";
import { TooltipProvider } from "@zentro/ui/shadcn/tooltip";

import "./globals.css";
import { WorkspaceSidebar } from "../components/layout/workspace-sidebar";
import { getDashboardContext } from "../lib/dashboard-context";
import { DocsNavbar } from "../components/layout/docs-navbar";
import { getAuthAppUrl, getOrgAppUrl } from "@zentro/utils";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Zentro Docs",
  description: "Write, find, and organize workspace documentation in Zentro.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { organization, organizations, session } = await getDashboardContext();

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppTRPCProvider>
            <TooltipProvider>
              <SidebarProvider defaultOpen={false}>
                <WorkspaceSidebar orgSlug={organization.slug} />
                <SidebarInset>
                  <main>
                    <DocsNavbar
                      orgSlug={organization.slug}
                      organizations={organizations.map((org) => ({
                        id: org.id,
                        name: org.name,
                        slug: org.slug,
                        href: getAuthAppUrl({
                          path: `/api/auth/workspace-session-bridge?redirectTo=${encodeURIComponent(
                            getOrgAppUrl({
                              orgSlug: org.slug,
                              app: "docs",
                              path: "/docs",
                            }),
                          )}`,
                        }),
                      }))}
                      createOrganizationHref={getAuthAppUrl({
                        path: "/auth/create-organization",
                      })}
                      user={session.user}
                    />

                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </AppTRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
