import Link from "next/link";
import { FC } from "react";
import { PlusIcon, SettingsIcon, StarIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";

import { useFavoriteProjects } from "~/src/components/projects/favorites";
import {
  StatusPill,
  type ProjectListItem,
} from "~/src/components/projects/list";

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
  /** The project as the list reads it, for its health. */
  health: ProjectListItem;
  /** "Aug 4 → Dec 1" style dates, when known. */
  dates?: string;
};

export const ProjectHeader: FC<Props> = ({
  title,
  slug,
  projectId,
  keyPrefix,
  teamName,
  status = "active",
  health,
  dates,
}) => {
  const archived = status === "archived";
  const favorites = useFavoriteProjects();
  const favorite = favorites.ids.includes(projectId);

  return (
    <header className="flex flex-wrap items-center gap-4">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md border border-hairline bg-tint-tasks font-mono text-sm"
      >
        {title.charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
            {title}
          </h1>
          <StatusPill project={health} />
          <button
            type="button"
            aria-pressed={favorite}
            aria-label={
              favorite
                ? `Remove ${title} from favorites`
                : `Add ${title} to favorites`
            }
            onClick={() => favorites.toggle(projectId)}
            className="flex size-7 items-center justify-center rounded-sm text-ink-2 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StarIcon
              aria-hidden="true"
              className={cn("size-4", favorite && "fill-ink text-ink")}
            />
          </button>
        </div>
        <p className="font-mono text-xs text-ink-3">
          {keyPrefix ?? slug}
          {teamName ? ` · ${teamName} team` : " · Workspace level"}
          {dates ? ` · ${dates}` : ""}
        </p>
      </div>

      <span className="flex-1" />

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can
          permission={["projects.settings.manage", "projects.update"]}
          resource={{ projectId }}
        >
          <Button
            variant="outline"
            asChild
            className="h-10 border-hairline bg-transparent px-3.5"
          >
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
              trigger={
                <Button className="h-10 px-3.5 font-semibold">
                  <PlusIcon />
                  New task
                </Button>
              }
            />
          </Can>
        )}
      </div>
    </header>
  );
};
