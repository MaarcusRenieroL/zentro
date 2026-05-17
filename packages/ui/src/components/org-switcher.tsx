"use client";

import { FC } from "react";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { Button } from "@zentro/ui/shadcn/button";

type Organization = {
  id: string;
  name: string;
  slug: string;
  href: string;
};

type Props = {
  organizations: Organization[];
  activeOrgSlug: string;
  createOrganizationHref?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export const OrgSwitcher: FC<Props> = ({
  organizations,
  activeOrgSlug,
  createOrganizationHref = "http://localhost:3001/auth/create-organization",
}) => {
  const activeOrganization =
    organizations.find((org) => org.slug === activeOrgSlug) ?? organizations[0];

  if (!activeOrganization) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 max-w-[220px] justify-start gap-2 px-2 sm:max-w-[280px]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {getInitials(activeOrganization.name) || (
              <Building2 className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">
              {activeOrganization.name}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map((organization) => {
          const isActive = organization.slug === activeOrgSlug;

          return (
            <DropdownMenuItem
              key={organization.id}
              asChild={!isActive}
              className="gap-3 py-2"
            >
              {isActive ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(organization.name) || (
                        <Building2 className="h-4 w-4" />
                      )}
                    </span>
                    <span className="block truncate font-medium">
                      {organization.name}
                    </span>
                  </div>
                  <Check className="ml-auto h-4 w-4 text-primary" />
                </div>
              ) : (
                <a href={organization.href}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {getInitials(organization.name) || (
                      <Building2 className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {organization.name}
                    </span>
                  </span>
                </a>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2">
          <a href={createOrganizationHref}>
            <Plus className="h-4 w-4" />
            Create organization
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
