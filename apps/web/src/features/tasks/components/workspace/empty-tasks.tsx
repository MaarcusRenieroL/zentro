import { ListIcon, PlusIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import { Card, CardContent } from "@zentro/ui/shadcn/card";

export const EmptyTasks = () => {
  return (
    <Card className="rounded-lg border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ListIcon className="size-5" />
        </div>

        <div>
          <h3 className="text-sm font-semibold">No tasks yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create the first task to start tracking work in this workspace.
          </p>
        </div>

        <Button size="sm">
          <PlusIcon className="size-4" />
          Create task
        </Button>
      </CardContent>
    </Card>
  );
};
