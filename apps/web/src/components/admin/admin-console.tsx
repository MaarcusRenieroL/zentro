"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { PageHeader } from "@zentro/ui/components/page-header";

type Out = inferRouterOutputs<AppRouter>["admin"];

const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/usage", label: "Usage" },
  { href: "/admin/security", label: "Security" },
];

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;

  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <PageHeader
        title="Administration"
        description="Usage, security and setup for the whole organization."
      />
      <nav aria-label="Administration sections" className="flex gap-1">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            aria-current={pathname === section.href ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              pathname === section.href
                ? "bg-sunken font-medium text-ink"
                : "text-ink-2 hover:bg-sunken"
            }`}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

function useAdminData<K extends keyof Out>(key: K) {
  const trpc = useTrpcClient();
  const [data, setData] = useState<
    inferRouterOutputs<AppRouter>["admin"][K] | null
  >(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const procedure = trpc.admin[key] as unknown as {
      query: () => Promise<inferRouterOutputs<AppRouter>["admin"][K]>;
    };

    procedure.query().then(setData, () => setFailed(true));
  }, [trpc, key]);

  return { data, failed };
}

function Loading({ failed }: { failed: boolean }) {
  return failed ? (
    <EmptyState
      title="This did not load"
      description="Check your connection and reload the page."
    />
  ) : (
    <p role="status" className="text-sm text-ink-2">
      Loading…
    </p>
  );
}

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-line p-4">
    <dt className="text-xs text-ink-2">{label}</dt>
    <dd className="font-mono text-xl text-ink">{value}</dd>
    {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
  </div>
);

export function AdminOverview() {
  const { data, failed } = useAdminData("overview");

  return (
    <Shell>
      {!data ? (
        <Loading failed={failed} />
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Members"
              value={String(data.members)}
              hint={
                data.pendingInvites
                  ? `${data.pendingInvites} invited`
                  : undefined
              }
            />
            <Stat label="Teams" value={String(data.teams)} />
            <Stat label="Projects" value={String(data.projects)} />
            <Stat
              label="Storage"
              value={formatBytes(data.storageBytes)}
              hint={`${data.fileCount} files`}
            />
          </dl>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="setup" className="flex flex-col gap-3">
              <h2 id="setup" className="text-sm font-semibold text-ink">
                Setup
              </h2>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {data.setup.map((step) => (
                  <li key={step.id}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {step.done ? (
                        <CheckCircle2Icon
                          className="size-4 text-ink"
                          aria-label="Done"
                        />
                      ) : (
                        <CircleIcon
                          className="size-4 text-ink-3"
                          aria-label="To do"
                        />
                      )}
                      <span className={step.done ? "text-ink-2" : "text-ink"}>
                        {step.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="recent" className="flex flex-col gap-3">
              <h2 id="recent" className="text-sm font-semibold text-ink">
                Recent actions
              </h2>
              {data.recent.length ? (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {data.recent.map((event) => (
                    <li key={event.id} className="px-4 py-3 text-sm">
                      <p className="text-ink">{event.text}</p>
                      <p className="text-xs text-ink-3">
                        {dateFormat.format(new Date(event.at))}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Nothing has happened yet.</p>
              )}
              <Link
                href="/settings/organization/audit-log"
                className="text-sm text-ink-2 underline"
              >
                Open the full audit log
              </Link>
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}

export function AdminUsage() {
  const { data, failed } = useAdminData("usage");

  return (
    <Shell>
      {!data ? (
        <Loading failed={failed} />
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Stat label="Tasks" value={String(data.tasks)} />
            <Stat label="Docs" value={String(data.docs)} />
          </dl>
          <section aria-labelledby="uploaders" className="flex flex-col gap-3">
            <h2 id="uploaders" className="text-sm font-semibold text-ink">
              Storage by uploader
            </h2>
            {data.uploaders.length ? (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {data.uploaders.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <span className="truncate text-ink">{row.name}</span>
                    <span className="font-mono text-ink-2">
                      {row.files} {row.files === 1 ? "file" : "files"} ·{" "}
                      {formatBytes(row.bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-2">No files have been uploaded.</p>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}

export function AdminSecurity() {
  const { data, failed } = useAdminData("security");

  return (
    <Shell>
      {!data ? (
        <Loading failed={failed} />
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Owners and admins"
              value={String(data.privileged.length)}
            />
            <Stat
              label="Failed sign-ins, 7 days"
              value={String(data.failedSignIns)}
            />
            <Stat
              label="Invitations older than 7 days"
              value={String(data.staleInvitations.length)}
            />
          </dl>

          <section aria-labelledby="keys" className="flex flex-col gap-3">
            <h2 id="keys" className="text-sm font-semibold text-ink">
              Who can administer
            </h2>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {data.privileged.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-ink">
                      {person.name}
                    </span>
                    <span className="text-xs text-ink-3">{person.email}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {!person.verified ? (
                      <span className="rounded-full bg-tint-sun px-2 py-0.5 text-xs">
                        Email not verified
                      </span>
                    ) : null}
                    <span className="rounded-full bg-sunken px-2 py-0.5 text-xs capitalize">
                      {person.role}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {data.staleInvitations.length ? (
            <section aria-labelledby="stale" className="flex flex-col gap-3">
              <h2 id="stale" className="text-sm font-semibold text-ink">
                Invitations still waiting
              </h2>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {data.staleInvitations.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <span className="truncate text-ink">{invite.email}</span>
                    <span className="text-xs text-ink-3">
                      sent {dateFormat.format(new Date(invite.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/settings/organization/invitations"
                className="text-sm text-ink-2 underline"
              >
                Manage invitations
              </Link>
            </section>
          ) : null}
        </>
      )}
    </Shell>
  );
}
