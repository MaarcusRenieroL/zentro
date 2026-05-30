import { Badge } from "@zentro/ui/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { FC } from "react";

type Props = {
  status: string;
  owner: string;
  createdAt: Date;
  startDate: Date;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const ProjectDetails: FC<Props> = ({
  status,
  owner,
  createdAt,
  startDate,
}) => {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Project Details
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-[96px_1fr] gap-x-4 gap-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground">Status</h4>
        <div>
          <Badge className="capitalize">{status}</Badge>
        </div>

        <h4 className="text-sm font-semibold text-muted-foreground">Owner</h4>
        <p className="break-words text-sm text-foreground">{owner}</p>

        <h4 className="text-sm font-semibold text-muted-foreground">
          Created At
        </h4>
        <p className="text-sm text-foreground">{formatDate(createdAt)}</p>

        <h4 className="text-sm font-semibold text-muted-foreground">
          Start Date
        </h4>
        <p className="text-sm text-foreground">{formatDate(startDate)}</p>
      </CardContent>
    </Card>
  );
};
