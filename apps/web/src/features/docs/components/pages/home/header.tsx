import { FC } from "react";

import { CreateDocModal } from "./create-doc-modal";

export const Header: FC = () => (
  <div className="flex flex-wrap items-center gap-3">
    <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
      Docs
    </h1>
    <span className="flex-1" />
    <CreateDocModal />
  </div>
);
