"use client";

import { usePageCrumb } from "~/src/components/shell/breadcrumb-context";
import { paths } from "~/src/lib/paths";
import {
  ChevronLeftIcon,
  SettingsIcon,
  Trash2Icon,
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
      label: "Danger zone",
      icon: Trash2Icon,
    },
  ];

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={paths.project(project.slug)}
          className="flex w-fit items-center gap-1.5 rounded-xs text-[13px] text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
          {project.name}
        </Link>
        <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
          Project settings
        </h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav
          aria-label="Project settings"
          className="hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0"
        >
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-selected font-medium text-ink"
                    : "text-ink-2 hover:bg-hover hover:text-ink",
                )}
              >
                <item.icon
                  className={cn("size-4", isActive && "text-signal")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
};
