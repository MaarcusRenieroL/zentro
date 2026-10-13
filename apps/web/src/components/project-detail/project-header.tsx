import { paths } from "~/src/lib/paths";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { ArchiveIcon, PlusIcon, RocketIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

type Props = {
  title: string;
  slug: string;
  description?: string | null;
  status: string;
};

export const ProjectHeader: FC<Props> = ({
  title,
  slug,
  description,
  status = "active",
}) => {
  const isArchived = status === "archived";

  return (
    <div className="flex w-full flex-col gap-5 rounded-md border bg-card/50 p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary">
          <RocketIcon className="size-5 text-primary" />
        </div>

        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold text-foreground">
              {title}
            </h1>

            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status === "active" ? "Active" : "Archived"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{slug}</p>

          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description provided.
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link href={paths.projectSettings(slug)}>
          <Button size="sm" variant="secondary" className="gap-2">
            <SettingsIcon className="size-4" />
            Settings
          </Button>
        </Link>

        <Button size="sm" className="gap-2" disabled={isArchived}>
          {isArchived ? (
            <ArchiveIcon className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          <span>{isArchived ? "Archived" : "New task"}</span>
        </Button>
      </div>
    </div>
  );
};
