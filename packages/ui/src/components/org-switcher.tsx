"use client";

import { FC, ReactNode, useId, useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

import { OrgAvatar } from "./org-avatar";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  organizations: Organization[];
  activeOrgSlug: string;
  createOrganizationHref?: string;
  onSwitchOrganization: (organizationId: string) => void | Promise<void>;
  className?: string;
  /** The second line under the name, in mono: "Admin · 18 people". */
  subtitle?: string;
  /** Replaces the squircle mark in the trigger (the app uses the logo mark). */
  mark?: ReactNode;
};

/** The organization menu: a searchable list with squircle marks. */
export const OrgSwitcher: FC<Props> = ({
  organizations,
  activeOrgSlug,
  createOrganizationHref,
  onSwitchOrganization,
  className,
  subtitle,
  mark,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();
  const active =
    organizations.find((org) => org.slug === activeOrgSlug) ?? organizations[0];
  const shown = useMemo(
    () =>
      organizations.filter((org) =>
        org.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [organizations, query],
  );

  if (!active) {
    return null;
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Organization: ${active.name}`}
          aria-haspopup="listbox"
          data-slot="org-switcher"
          className={cn(
            "flex h-10 w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-left outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
            className,
          )}
        >
          {mark ?? <OrgAvatar name={active.name} seed={active.id} />}
          <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm leading-[18px] font-semibold text-ink">
              {active.name}
            </span>
            {subtitle ? (
              <span className="truncate font-mono text-[11px] leading-4 text-ink-3">
                {subtitle}
              </span>
            ) : null}
          </span>
          <ChevronsUpDownIcon
            className="size-3.5 shrink-0 text-ink-3 group-data-[collapsible=icon]:hidden"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 p-1.5">
        {organizations.length > 4 ? (
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an organization"
            aria-label="Find an organization"
            className="mb-1"
          />
        ) : null}
        <div
          id={listId}
          role="listbox"
          aria-label="Organizations"
          className="flex flex-col gap-0.5"
        >
          {shown.map((organization) => {
            const isActive = organization.slug === active.slug;

            return (
              <button
                key={organization.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setOpen(false);

                  if (!isActive) void onSwitchOrganization(organization.id);
                }}
                className="flex h-9 items-center gap-2 rounded-md px-1.5 text-left text-sm outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
              >
                <OrgAvatar
                  name={organization.name}
                  seed={organization.id}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate">
                  {organization.name}
                </span>
                {isActive ? (
                  <CheckIcon
                    className="size-4 text-signal"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
          {!shown.length ? (
            <p className="px-2 py-3 text-center text-xs text-ink-3">
              No organization matches.
            </p>
          ) : null}
        </div>
        {createOrganizationHref ? (
          <>
            <div className="my-1 h-px bg-hairline" />
            <a
              href={createOrganizationHref}
              className="flex h-9 items-center gap-2 rounded-md px-1.5 text-sm text-ink-2 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-6 items-center justify-center rounded-[28%] border border-dashed border-border-strong">
                <PlusIcon className="size-3.5" aria-hidden="true" />
              </span>
              Create organization
            </a>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
