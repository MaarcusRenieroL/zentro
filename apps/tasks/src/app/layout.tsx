import type { Metadata, Viewport } from "next";

import { Toaster } from "@zentro/ui/shadcn/sonner";

import { getDashboardContext } from "~/src/lib/dashboard-context";
import { AppTRPCProvider } from "../components/providers/trpc-provider";
import { ThemeProvider } from "../components/providers/theme-provider";
import "./globals.css";
import { TasksNavbar } from "../components/layout/tasks-navbar";
import { getAuthAppUrl, getOrgAppUrl } from "@zentro/utils";
import { TooltipProvider } from "@zentro/ui/components/shadcn/tooltip";
import {
  SidebarInset,
  SidebarProvider,
} from "@zentro/ui/components/shadcn/sidebar";
import { WorkspaceSidebar } from "../components/layout/workspace-sidebar";

export const metadata: Metadata = {
  title: "Zentro Tasks",
  description: "Plan, assign, and track startup work in one Zentro workspace.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
                    <TasksNavbar
                      orgSlug={organization.slug}
                      organizations={organizations.map((org) => ({
                        id: org.id,
                        name: org.name,
                        slug: org.slug,
                        href: getAuthAppUrl({
                          path: `/api/auth/workspace-session-bridge?redirectTo=${encodeURIComponent(
                            getOrgAppUrl({
                              orgSlug: org.slug,
                              app: "tasks",
                              path: "/tasks",
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
