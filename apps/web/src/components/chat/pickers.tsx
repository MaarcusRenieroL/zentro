"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";

import type { Person } from "./composer";

/** Chips for the chosen people, with a box to find more. */
export function PeoplePicker({
  people,
  selected,
  onChange,
  placeholder = "Add people…",
}: {
  people: Person[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const chosen = people.filter((person) => selected.includes(person.memberId));
  const needle = query.trim().toLowerCase();
  const matches = people
    .filter((person) => !selected.includes(person.memberId) && !person.isMe)
    .filter(
      (person) =>
        needle &&
        (person.name.toLowerCase().includes(needle) ||
          person.email.toLowerCase().includes(needle)),
    )
    .slice(0, 5);

  return (
    <div className="relative">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
        {chosen.map((person) => (
          <span
            key={person.memberId}
            className="flex h-7 items-center gap-1.5 rounded-full border border-hairline bg-hover pr-1.5 pl-1 text-sm"
          >
            <ActorAvatar name={person.name} size={20} />
            {person.name.split(" ")[0]}
            <button
              type="button"
              aria-label={`Remove ${person.name}`}
              onClick={() =>
                onChange(selected.filter((id) => id !== person.memberId))
              }
              className="text-ink-3 hover:text-ink"
            >
              <XIcon className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={chosen.length ? "" : placeholder}
          aria-label="Find people"
          className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
        />
      </div>
      {matches.length ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-lg border border-hairline bg-popover p-1 shadow-lg"
        >
          {matches.map((person) => (
            <li key={person.memberId}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onChange([...selected, person.memberId]);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover"
              >
                <ActorAvatar name={person.name} size={22} />
                <span className="flex-1">{person.name}</span>
                <span className="font-mono text-[11px] text-ink-3">
                  {person.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type LinkValue = { type: "team" | "project"; id: string } | null;

/** Team, Project or Nothing, then which one. */
export function LinkPicker({
  value,
  onChange,
  disabled,
}: {
  value: LinkValue;
  onChange: (value: LinkValue) => void;
  disabled?: boolean;
}) {
  const trpc = useTrpcClient();
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; key: string }>
  >([]);
  const mode = value?.type ?? "none";

  useEffect(() => {
    let live = true;

    void Promise.all([
      trpc.team.getAll.query().catch(() => []),
      trpc.project.getProjectsByOrgId.query().catch(() => []),
    ]).then(([teamRows, projectRows]) => {
      if (!live) return;

      setTeams(teamRows.map((team) => ({ id: team.id, name: team.name })));
      setProjects(
        projectRows
          .filter((project) => !project.archivedAt)
          .map((project) => ({
            id: project.id,
            name: project.name,
            key: project.taskKeyPrefix,
          })),
      );
    });

    return () => {
      live = false;
    };
  }, [trpc]);

  const options = mode === "team" ? teams : mode === "project" ? projects : [];
  const key = value && projects.find((project) => project.id === value.id)?.key;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Link type"
          className="flex gap-1 rounded-lg border border-hairline bg-sunken p-1"
        >
          {(
            [
              ["team", "Team"],
              ["project", "Project"],
              ["none", "Nothing"],
            ] as const
          ).map(([next, label]) => (
            <button
              key={next}
              type="button"
              role="radio"
              aria-checked={mode === next}
              disabled={disabled}
              onClick={() => {
                if (next === "none") onChange(null);
                else {
                  const first = (next === "team" ? teams : projects)[0];

                  onChange(first ? { type: next, id: first.id } : null);
                }
              }}
              className={cn(
                "rounded-md px-3 py-1 text-sm",
                mode === next
                  ? "bg-surface font-medium shadow-sm"
                  : "text-ink-2 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {mode !== "none" ? (
          <select
            aria-label={mode === "team" ? "Team" : "Project"}
            value={value?.id ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                type: mode as "team" | "project",
                id: event.target.value,
              })
            }
            className="h-9 min-w-48 rounded-lg border border-input bg-surface px-2.5 text-sm"
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <p className="text-[13px] text-ink-3">
        {mode === "project"
          ? `${key ?? "Project"} keys mentioned here link to their tasks. Lists under Project channels.`
          : mode === "team"
            ? "Lists under Team channels with this team’s name."
            : "Not linked to a team or project."}
      </p>
    </div>
  );
}
