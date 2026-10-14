"use client";

import { type FC } from "react";

import { BellIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

// There is no notification source yet, so the list is always empty.
export const NotificationPopover: FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <BellIcon />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 gap-0 p-0" side="bottom" align="end">
        <div className="border-b border-hairline px-4 py-2.5 text-sm font-semibold">
          Notifications
        </div>
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <BellIcon className="size-5 text-ink-3" aria-hidden="true" />
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs text-ink-2">
            Updates about your work will show up here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
