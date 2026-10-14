import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { FC } from "react";

type Props = {
  totalMembers: number;
  owner: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export const ProjectContributors: FC<Props> = ({ totalMembers, owner }) => {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Contributors</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(owner) || "UO"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {owner}
            </p>
            <p className="text-xs text-muted-foreground">Project owner</p>
          </div>
        </div>
        <div className="rounded-xl bg-sunken px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {totalMembers} total
        </div>
      </CardContent>
    </Card>
  );
};
