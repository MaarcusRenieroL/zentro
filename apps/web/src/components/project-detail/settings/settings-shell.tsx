"use client";

import { usePageCrumb } from "~/src/components/shell/breadcrumb-context";
import { paths } from "~/src/lib/paths";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  Building2Icon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { FC, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@zentro/ui/index";

type Props = {
  project: {
    name: string;
    slug: string;
  };
  children: ReactNode;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export const SettingsShell: FC<Props> = ({ project, children }) => {
  const pathname = usePathname();

  usePageCrumb(`/projects/${project.slug}`, project.name);

  const settingsNavItems = [
    {
      href: paths.projectGeneralSettings(project.slug),
      label: "General",
      icon: SettingsIcon,
    },
    {
      href: paths.projectAccessSettings(project.slug),
      label: "Members & access",
      icon: UsersIcon,
    },
    {
      href: paths.projectDangerSettings(project.slug),
      label: "Danger Zone",
      icon: AlertTriangleIcon,
    },
  ];

  return (
    <section>
      <div className="flex w-full flex-col gap-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-hairline/60 bg-card shadow-sm text-base font-semibold text-foreground shadow-sm sm:size-14 sm:text-lg">
            {getInitials(project.name) || <Building2Icon className="size-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-3xl">
              Project Settings
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {project.name} · {project.slug}
            </p>
          </div>
          <Link
            href={paths.project(project.slug)}
            className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <ArrowLeftIcon className="size-4" />
            Back to project
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
          <nav className="flex min-w-max gap-4 sm:gap-6">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </section>
  );
};
