import {
  AtSignIcon,
  CalendarIcon,
  CheckSquareIcon,
  FileIcon,
  FolderIcon,
  UsersIcon,
} from "lucide-react";
import { FC } from "react";

type Props = {
  name: string;
  orgName: string;
};

export const ActivitySection: FC<Props> = ({ name, orgName }) => {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const activityStats = [
    {
      icon: CheckSquareIcon,
      label: "12 tasks due",
      iconClassName: "text-purple-500",
    },
    {
      icon: CalendarIcon,
      label: "5 events today",
      iconClassName: "text-orange-500",
    },
    {
      icon: FileIcon,
      label: "2 docs updated",
      iconClassName: "text-blue-500",
    },
    {
      icon: AtSignIcon,
      label: "3 mentions",
      iconClassName: "text-green-500",
    },
  ];

  const workspaceStats = [
    {
      icon: UsersIcon,
      value: "32",
      label: "Members",
    },
    {
      icon: FolderIcon,
      value: "18",
      label: "Projects",
    },
    {
      icon: CheckSquareIcon,
      value: "245",
      label: "Tasks",
    },
  ];

  return (
    <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] xl:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {greeting}, {name}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Here&apos;s what&apos;s happening in {orgName} today.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-wrap xl:items-center">
          {activityStats.map((stat) => (
            <div
              key={stat.label}
              className="flex h-11 min-w-0 items-center gap-2 rounded-md border bg-card/70 px-3 text-sm shadow-sm sm:px-4"
            >
              <stat.icon className={`size-4 shrink-0 ${stat.iconClassName}`} />
              <p className="truncate">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full rounded-md border bg-card/50 p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-medium">Workspace overview</h2>
        <div className="mt-5 grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {workspaceStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:items-start sm:justify-center sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0"
            >
              <stat.icon className="text-muted-foreground mt-1 size-5" />
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
