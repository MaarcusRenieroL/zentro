"use client";

import { useState } from "react";
import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

import { Section } from "./section";

const abilities = [
  "See projects, tasks and docs",
  "Create and edit tasks",
  "Write and comment on docs",
  "Invite and remove members",
  "Create and edit roles",
  "Read the audit log",
  "Delete the organization",
] as const;

const roles = [
  {
    id: "owner",
    name: "Owner",
    blurb: "Everything, including the actions only an owner can take.",
    can: [true, true, true, true, true, true, true],
  },
  {
    id: "admin",
    name: "Admin",
    blurb: "Runs the organization, except the owner-only actions.",
    can: [true, true, true, true, true, true, false],
  },
  {
    id: "member",
    name: "Member",
    blurb: "Works with tasks and docs, and nothing administrative.",
    can: [true, true, true, false, false, false, false],
  },
  {
    id: "custom",
    name: "Your own role",
    blurb:
      "Build a role from individual permissions. This one can see and comment, nothing more.",
    can: [true, false, true, false, false, false, false],
  },
] as const;

export function PermissionsDemo() {
  const [active, setActive] = useState<(typeof roles)[number]["id"]>("member");
  const role = roles.find((item) => item.id === active) ?? roles[2];

  return (
    <Section
      id="permissions"
      eyebrow="Permissions"
      title="Access you can explain in one sentence"
      lead="Start from the built-in roles, or build your own. Give someone a role on a single project without opening up the rest."
      className="bg-sunken/60"
    >
      <div className="mx-auto grid max-w-4xl gap-4 rounded-3xl bg-surface p-3 shadow-md ring-1 ring-hairline/60 sm:p-4 md:grid-cols-[14rem_1fr]">
        <div
          role="tablist"
          aria-label="Role"
          className="flex gap-1 overflow-x-auto md:flex-col"
        >
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active}
              onClick={() => setActive(item.id)}
              className={cn(
                "shrink-0 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors md:w-full",
                item.id === active
                  ? "bg-signal text-on-signal shadow-sm"
                  : "text-ink-2 hover:bg-sunken hover:text-ink",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-sunken p-5 sm:p-6">
          <p className="font-display text-2xl text-ink">{role.name}</p>
          <p className="mt-1 text-sm text-ink-2">{role.blurb}</p>
          <ul className="mt-5 space-y-1.5" role="tabpanel">
            {abilities.map((label, index) => {
              const allowed = role.can[index];

              return (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-2.5 text-sm"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full",
                      allowed
                        ? "bg-success-subtle text-success-text"
                        : "bg-sunken text-ink-3",
                    )}
                  >
                    {allowed ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <MinusIcon className="size-3.5" />
                    )}
                  </span>
                  <span className={allowed ? "text-ink" : "text-ink-3"}>
                    {label}
                    <span className="sr-only">
                      {allowed ? ": allowed" : ": not allowed"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Section>
  );
}
