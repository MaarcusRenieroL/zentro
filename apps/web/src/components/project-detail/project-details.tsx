import Link from "next/link";
import { FC } from "react";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { StatusPill } from "~/src/components/projects/list";
import type { ProjectListItem } from "~/src/components/projects/list";

type Props = {
  /** The project as the list reads it, for its health. */
  project: ProjectListItem;
  owner: string;
  startDate: Date;
  teamName?: string | null;
  keyPrefix?: string | null;
  /** Everyone with work here, lead first. */
  people: string[];
  /** Where to manage who has access, when the viewer may. */
  manageHref?: string | null;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-10 grid-cols-[88px_minmax(0,1fr)] items-center gap-3 border-b border-hairline/70 py-1 last:border-b-0">
      <dt className="text-[13px] text-ink-3">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export const ProjectDetails: FC<Props> = ({
  project,
  owner,
  startDate,
  teamName,
  keyPrefix,
  people,
  manageHref,
}) => (
  <section aria-label="Details" className="tile px-4 py-2">
    <dl>
      <Row label="Status">
        <StatusPill project={project} />
      </Row>
      <Row label="Lead">
        <span className="flex items-center gap-2.5">
          <ActorAvatar name={owner} size={24} />
          {owner}
        </span>
      </Row>
      <Row label="Team">
        <span className="flex items-center gap-2.5">
          {teamName ? (
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px] border border-hairline bg-tint-teams"
            />
          ) : null}
          <span className={teamName ? undefined : "text-ink-3"}>
            {teamName ?? "Workspace level"}
          </span>
        </span>
      </Row>
      <Row label="Start">
        <span className="font-mono text-[13px]">{formatDate(startDate)}</span>
      </Row>
      {keyPrefix ? (
        <Row label="Key prefix">
          <span className="font-mono text-[13px]">{keyPrefix}</span>
        </Row>
      ) : null}
      <Row label="People">
        <span className="flex items-center gap-2">
          <span className="flex">
            {people.slice(0, 6).map((name, index) => (
              <span
                key={name}
                title={name}
                className={
                  index
                    ? "-ml-1.5 rounded-full ring-2 ring-surface"
                    : "rounded-full ring-2 ring-surface"
                }
              >
                <ActorAvatar name={name} size={24} />
              </span>
            ))}
          </span>
          {people.length > 6 ? (
            <span className="font-mono text-xs text-ink-3">
              +{people.length - 6}
            </span>
          ) : null}
          <span className="flex-1" />
          {manageHref ? (
            <Link
              href={manageHref}
              className="rounded-xs text-[13px] text-signal hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Manage
            </Link>
          ) : null}
        </span>
      </Row>
    </dl>
  </section>
);
