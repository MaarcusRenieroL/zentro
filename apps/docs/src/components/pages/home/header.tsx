import { FC } from "react";
import { FileTextIcon } from "lucide-react";
import { CreateDocModal } from "./create-doc-modal";

export const Header: FC = () => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-sm">
          <FileTextIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
          <p className="text-sm text-muted-foreground">
            Find and organize documentation across your workspace.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <CreateDocModal />
      </div>
    </div>
  );
};
