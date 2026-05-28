"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zentro/ui/shadcn/input-group";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@zentro/ui/components/shadcn/dropdown-menu";
import { CreateProjectModal } from "./create-project-modal";

type ProjectToolbarProps = {
  onProjectCreated: () => void | Promise<void>;
};

export const ProjectToolbar = ({ onProjectCreated }: ProjectToolbarProps) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-md text-muted-foreground">
            Track active work across your workspace.
          </p>
        </div>
        <CreateProjectModal onProjectCreated={onProjectCreated} />
      </div>
      <div className="flex items-center justify-between gap-5">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search"
            placeholder="Search"
            type="search"
          />
        </InputGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Sort: Recently updated
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Recently updated</DropdownMenuItem>
            <DropdownMenuItem>Name</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
