import { FC } from "react";

import { ActorAvatar } from "~/src/components/actor-avatar";

export type Contributor = { name: string; open: number; lead: boolean };

type Props = {
  contributors: Contributor[];
};

/** The people with work in this project: the lead first, then by open work. */
export const ProjectContributors: FC<Props> = ({ contributors }) => (
  <section aria-label="Contributors" className="flex flex-col gap-2.5">
    <div className="flex items-center gap-2.5 px-1">
      <h2 className="text-[15px] font-semibold">Contributors</h2>
      <span className="font-mono text-xs text-ink-2">
        {contributors.length}
      </span>
    </div>
    {contributors.length ? (
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {contributors.map((person) => (
          <li
            key={person.name}
            className="flex items-center gap-3 rounded-md border border-hairline bg-surface px-3.5 py-3"
          >
            <ActorAvatar name={person.name} size={36} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {person.name}
              </span>
              <span className="text-[13px] text-ink-3">
                {person.lead ? "Project lead" : "Has work here"}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-sm border border-hairline px-1.5 py-px text-xs">
                {person.lead ? "Lead" : "Member"}
              </span>
              <span className="font-mono text-[11px] text-ink-3">
                {person.open} open
              </span>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="px-1 text-sm text-ink-3">
        Nobody has work here yet. Assign a task to bring someone in.
      </p>
    )}
  </section>
);
