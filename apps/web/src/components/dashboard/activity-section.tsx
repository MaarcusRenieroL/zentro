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
    <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}, {name}
          </h1>
          <p className="text-muted-foreground text-base">
            Here&apos;s what&apos;s happening in {orgName} today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activityStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card/70 flex h-11 items-center gap-2 rounded-md border px-4 text-sm shadow-sm"
            >
              <stat.icon className={`size-4 ${stat.iconClassName}`} />
              <p className="whitespace-nowrap">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/50 w-full rounded-md border p-5 shadow-sm lg:max-w-md">
        <h2 className="text-sm font-medium">Workspace overview</h2>
        <div className="mt-5 grid grid-cols-3 divide-x divide-border">
          {workspaceStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-start justify-center gap-3 px-4 first:pl-0 last:pr-0"
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
