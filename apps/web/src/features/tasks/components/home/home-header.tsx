import { FC } from "react";

import { ModuleTabs } from "~/src/components/shell/module-section-nav";
import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";

type Props = {
  organizationName: string;
};

/** The same header as the task list: title, Create task, section tabs. */
export const HomeHeader: FC<Props> = () => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          Tasks
        </h1>
        <span className="flex-1" />
        <CreateTaskModal />
      </div>

      <ModuleTabs className="mt-4" />
    </div>
  );
};
