import { FC } from "react";

type Props = {
  organizationName: string;
};

export const HomeHeader: FC<Props> = ({ organizationName }) => {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b pb-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Summary</p>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {organizationName}
        </h1>

        <p className="max-w-2xl text-sm text-muted-foreground">
          A quick snapshot of task progress, priorities, and recent changes.
        </p>
      </div>
    </div>
  );
};
