"use client";

import { useId, useMemo, useState, type ReactElement } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";

type ComboboxProps = {
  options: ReadonlyArray<{ value: string; label: string; hint?: string }>;
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  "aria-invalid"?: boolean;
};

/** A searchable select. Arrow keys move, Enter chooses, Escape closes. */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyText = "Nothing matches that.",
  className,
  ...props
}: ComboboxProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listId = useId();
  const matches = useMemo(
    () =>
      options.filter((option) =>
        `${option.label} ${option.hint ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [options, query],
  );
  const selected = options.find((option) => option.value === value);

  const choose = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={props["aria-invalid"]}
          className={cn(
            "flex h-(--control-h) w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-surface px-3 text-left text-sm outline-none transition-colors hover:border-ink-3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-danger",
            !selected && "text-ink-3",
            className,
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon
            className="size-4 shrink-0 text-ink-3"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 p-1.5"
      >
        <input
          autoFocus
          value={query}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          aria-controls={listId}
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((index) => Math.min(index + 1, matches.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && matches[cursor]) {
              event.preventDefault();
              choose(matches[cursor].value);
            }
          }}
          className="mb-1 h-9 w-full rounded-sm bg-sunken px-2.5 text-sm outline-none placeholder:text-ink-3 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto">
          {matches.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-ink-2">{emptyText}</li>
          ) : (
            matches.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setCursor(index)}
                onClick={() => choose(option.value)}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-sm",
                  index === cursor && "bg-hover",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.hint ? (
                  <span className="font-mono text-xs text-ink-3">
                    {option.hint}
                  </span>
                ) : null}
                {option.value === value ? (
                  <CheckIcon
                    className="size-4 text-signal"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
