import { FC } from "react";

import { ActorAvatar } from "~/src/components/actor-avatar";

type Props = {
  totalMembers: number;
  owner: string;
};

export const ProjectContributors: FC<Props> = ({ totalMembers, owner }) => (
  <section aria-label="Contributors" className="tile px-4 py-3.5">
    <h2 className="pb-2.5 text-[15px] font-semibold">Contributors</h2>
    <div className="flex items-center gap-3">
      <ActorAvatar name={owner} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{owner}</p>
        <p className="text-xs text-ink-3">Project owner</p>
      </div>
      <span className="font-mono text-xs text-ink-2">
        {totalMembers} in org
      </span>
    </div>
  </section>
);
