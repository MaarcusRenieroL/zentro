"use client";

import {
  Suspense,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@zentro/ui/shadcn/sidebar";
import { TooltipProvider } from "@zentro/ui/shadcn/tooltip";

import { AppSidebar, type ShellModule } from "./app-sidebar";
import { OfflineBanner } from "./offline-banner";
import { NotificationsProvider } from "~/src/components/notifications/notifications-provider";

import { BreadcrumbProvider } from "./breadcrumb-context";
import { RouteProgress } from "./route-progress";
import { ShellContext } from "./shell-context";
import { TopBar } from "./top-bar";

type Props = {
  modules: ShellModule[];
  enabledModules: string[];
  organizations: Array<{ id: string; name: string; slug: string }>;
  activeOrgSlug: string;
  user: { name: string; email: string };
  links: { settingsHref: string | null; membersHref: string | null };
  sidebarOpen: boolean;
  orgSubtitle?: string;
  taskCount?: number;
  children: ReactNode;
};

/**
 * The frame of every workspace page: sidebar, top bar, and one content
 * container with a fixed width, gutter and rhythm.
 */
export function AppShell({
  modules,
  enabledModules,
  organizations,
  activeOrgSlug,
  user,
  links,
  sidebarOpen,
  orgSubtitle,
  taskCount,
  children,
}: Props) {
  const pathname = usePathname();
  const [version, setVersion] = useState(0);
  const refreshPage = useCallback(() => setVersion((value) => value + 1), []);
  const shell = useMemo(() => ({ refreshPage }), [refreshPage]);

  return (
    <ShellContext.Provider value={shell}>
      <NotificationsProvider>
        <BreadcrumbProvider>
          <TooltipProvider delayDuration={300}>
            <SidebarProvider defaultOpen={sidebarOpen}>
              <Suspense fallback={null}>
                <RouteProgress />
              </Suspense>
              <AppSidebar
                modules={modules}
                organizations={organizations}
                activeOrgSlug={activeOrgSlug}
                orgSubtitle={orgSubtitle}
                taskCount={taskCount}
              />
              <SidebarInset className="bg-canvas">
                <TopBar
                  orgName={
                    organizations.find((org) => org.slug === activeOrgSlug)
                      ?.name
                  }
                  enabledModules={enabledModules}
                  modules={modules}
                  user={user}
                  links={links}
                />
                <main
                  id="main"
                  tabIndex={-1}
                  className="mx-auto w-full max-w-[1440px] min-w-0 flex-1 overflow-x-clip px-4 pt-5 pb-12 outline-none md:px-(--gutter) md:pt-7 md:pb-16"
                >
                  <OfflineBanner />
                  <div
                    key={`${pathname}:${version}`}
                    className="animate-fade-up motion-reduce:animate-none"
                  >
                    {children}
                  </div>
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </BreadcrumbProvider>
      </NotificationsProvider>
    </ShellContext.Provider>
  );
}
