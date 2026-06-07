"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
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

type ProjectSort = "updated" | "name" | "status";

type ProjectToolbarProps = {
  onProjectCreated: () => void | Promise<void>;
  searchQuery: string;
  sortBy: ProjectSort;
  onSearchQueryChange: (query: string) => void;
  onSortByChange: (sort: ProjectSort) => void;
};

const sortOptions: Array<{ value: ProjectSort; label: string }> = [
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
];

export const ProjectToolbar = ({
  onProjectCreated,
  searchQuery,
  sortBy,
  onSearchQueryChange,
  onSortByChange,
}: ProjectToolbarProps) => {
  const activeSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ??
    "Recently updated";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-md text-muted-foreground">
            Track active work across your workspace.
          </p>
        </div>
        <CreateProjectModal onProjectCreated={onProjectCreated} />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search"
            placeholder="Search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </InputGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              Sort: {activeSortLabel}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortByChange(option.value)}
              >
                <CheckIcon
                  className={`size-4 ${
                    option.value === sortBy ? "opacity-100" : "opacity-0"
                  }`}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
