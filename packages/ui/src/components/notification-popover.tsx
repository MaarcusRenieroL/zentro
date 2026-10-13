"use client";

import { type FC } from "react";

import { BellIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import { Separator } from "@zentro/ui/shadcn/separator";

// There is no notification source yet, so the list is always empty.
export const NotificationPopover: FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <BellIcon />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="bottom" align="end">
        <div className="grid">
          <div className="px-4 py-2.5">
            <span className="font-medium">Notifications</span>
          </div>
          <Separator className="" />
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellIcon className="text-muted-foreground size-6" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-muted-foreground text-xs">
              Updates about your work will show up here.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
