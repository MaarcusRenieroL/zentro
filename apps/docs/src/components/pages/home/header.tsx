import { FC } from "react";
import { Button } from "@zentro/ui/shadcn/button";
import { FileUpIcon } from "lucide-react";
import { CreateDocModal } from "./create-doc-modal";

export const Header: FC = () => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
        <p className="text-sm text-muted-foreground">
          Find and organize all documentation across your workspace
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <CreateDocModal />

        <Button variant="outline">
          <FileUpIcon className="size-4" />
          Import
        </Button>
      </div>
    </div>
  );
};
