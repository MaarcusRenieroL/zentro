import Link from "next/link";
import { FC } from "react";
import { SettingsIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { Can } from "~/src/components/permissions/permission-provider";
import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";
import { paths } from "~/src/lib/paths";

type Props = {
  title: string;
  slug: string;
  projectId: string;
  /** The task key prefix, such as ZEN. */
  keyPrefix?: string | null;
  teamName?: string | null;
  description?: string | null;
  status: string;
};

export const ProjectHeader: FC<Props> = ({
  title,
  slug,
  projectId,
  keyPrefix,
  teamName,
  status = "active",
}) => {
  const archived = status === "archived";

  return (
    <header className="flex flex-wrap items-center gap-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint-tasks font-mono text-sm"
      >
        {title.charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
            {title}
          </h1>
          <span className="flex h-[22px] items-center gap-1.5 rounded-full border border-hairline px-2 text-xs">
            <span
              aria-hidden="true"
              className={
                archived
                  ? "size-1.5 rounded-full border border-ink-3"
                  : "size-1.5 rounded-full bg-status-done"
              }
            />
            {archived ? "Archived" : "Active"}
          </span>
        </div>
        <p className="font-mono text-xs text-ink-3">
          {keyPrefix ?? slug}
          {teamName ? ` · ${teamName} team` : " · Workspace level"}
        </p>
      </div>

      <span className="flex-1" />

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can
          permission={["projects.settings.manage", "projects.update"]}
          resource={{ projectId }}
        >
          <Button variant="outline" asChild>
            <Link href={paths.projectSettings(slug)}>
              <SettingsIcon />
              Settings
            </Link>
          </Button>
        </Can>

        {archived ? null : (
          <Can permission="tasks.create" resource={{ projectId }}>
            <CreateTaskModal
              defaultProjectId={projectId}
              trigger={<Button>New task</Button>}
            />
          </Can>
        )}
      </div>
    </header>
  );
};
