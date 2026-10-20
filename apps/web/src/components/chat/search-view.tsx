"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zentro/api/server";
import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { useChatSidebar } from "./chat-store";
import { usePeople } from "./channel-view";
import { MessageBody, relativeAgo } from "./message-body";
import { Avatar } from "./message-item";

type Result =
  inferRouterOutputs<AppRouter>["chat"]["search"]["results"][number];

const ranges = [
  ["any", "Any time", 0],
  ["7", "Last 7 days", 7],
  ["30", "Last 30 days", 30],
  ["90", "Last 90 days", 90],
] as const;

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  const active = value !== options[0]![0];

  return (
    <label
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px]",
        active ? "border-ink" : "border-hairline",
      )}
    >
      <span className="text-ink-3">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="max-w-36 bg-transparent font-medium outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Search every conversation you can read, with filters. */
export function SearchView() {
  const trpc = useTrpcClient();
  const router = useRouter();
  const params = useSearchParams();
  const sidebar = useChatSidebar();
  const people = usePeople();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "any");
  const [place, setPlace] = useState(params.get("in") ?? "any");
  const [has, setHas] = useState(params.get("has") ?? "any");
  const [range, setRange] = useState(params.get("range") ?? "30");
  const [results, setResults] = useState<Result[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(q), 250);

    return () => clearTimeout(timer);
  }, [q]);

  const filtering =
    from !== "any" || place !== "any" || has !== "any" || range !== "30";
  const days = ranges.find(([value]) => value === range)?.[2] ?? 0;

  useEffect(() => {
    if (!debounced.trim() && from === "any" && has === "any") {
      setResults(null);

      return;
    }

    let live = true;

    setResults(null);
    setFailed(false);
    trpc.chat.search
      .query({
        q: debounced.trim(),
        fromMemberId: from === "any" ? undefined : from,
        channelId: place === "any" ? undefined : place,
        has: has === "any" ? undefined : (has as "file" | "link" | "task"),
        after: days ? new Date(Date.now() - days * 86_400_000) : undefined,
      })
      .then((data) => live && setResults(data.results))
      .catch(() => live && setFailed(true));

    return () => {
      live = false;
    };
  }, [trpc, debounced, from, place, has, days]);

  const groups = useMemo(() => {
    const byChannel = new Map<string, { label: string; rows: Result[] }>();

    for (const result of results ?? []) {
      const entry = byChannel.get(result.channel.id) ?? {
        label: result.channel.name
          ? `#${result.channel.name}`
          : "Direct message",
        rows: [],
      };

      entry.rows.push(result);
      byChannel.set(result.channel.id, entry);
    }

    return [...byChannel.entries()];
  }, [results]);

  const words = debounced.split(/\s+/).filter(Boolean);
  const channels = sidebar.data?.channels ?? [];
  const clear = () => {
    setFrom("any");
    setPlace("any");
    setHas("any");
    setRange("30");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-tint-teams">
          <SearchIcon className="size-4" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold">Search messages</h2>
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => router.push("/chat")}>
          Esc
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-signal bg-surface px-3 ring-4 ring-ring/20">
        <SearchIcon className="size-4 text-ink-3" aria-hidden="true" />
        <input
          autoFocus
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && router.push("/chat")}
          placeholder="Search messages"
          aria-label="Search messages"
          className="h-11 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
        />
        {results ? (
          <span className="font-mono text-xs text-ink-3">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        ) : null}
        {q ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQ("")}
            className="text-ink-3 hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Filter
          label="From"
          value={from}
          onChange={setFrom}
          options={[
            ["any", "Anyone"],
            ...people.map((p): [string, string] => [p.memberId, p.name]),
          ]}
        />
        <Filter
          label="In"
          value={place}
          onChange={setPlace}
          options={[
            ["any", "Anywhere"],
            ...channels.map((c): [string, string] => [
              c.id,
              c.kind === "dm" ? c.title : `#${c.name}`,
            ]),
          ]}
        />
        <Filter
          label="Has"
          value={has}
          onChange={setHas}
          options={[
            ["any", "Any"],
            ["file", "File"],
            ["link", "Link"],
            ["task", "Task key"],
          ]}
        />
        <Filter
          label="Date"
          value={range}
          onChange={setRange}
          options={ranges.map(([value, label]): [string, string] => [
            value,
            label,
          ])}
        />
        {filtering ? (
          <button
            type="button"
            onClick={clear}
            className="text-[13px] text-signal-strong hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {!debounced.trim() && from === "any" && has === "any" ? (
        <p className="pt-10 text-center text-[15px] text-ink-2">
          Type a word to search every conversation you can read. Try{" "}
          <span className="font-mono text-[13px]">from</span> or{" "}
          <span className="font-mono text-[13px]">has</span> filters to narrow
          it.
        </p>
      ) : null}

      {results === null &&
      !failed &&
      (debounced.trim() || from !== "any" || has !== "any") ? (
        <div className="flex flex-col gap-3 pt-6" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-14" />
          ))}
        </div>
      ) : null}

      {failed ? (
        <p className="pt-10 text-center text-[15px] text-ink-2">
          Search didn’t answer. Try again in a moment.
        </p>
      ) : null}

      {results && results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="font-display text-[2rem] leading-10">
            No messages match “{debounced.trim()}”.
          </p>
          <p className="max-w-md text-[15px] text-ink-2">
            {filtering
              ? "Nothing matched with those filters. Removing a filter usually helps."
              : "Check the spelling, or try fewer words."}
          </p>
          {filtering ? (
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}

      {groups.map(([channelId, group]) => (
        <section key={channelId} className="flex flex-col pt-4">
          <h3 className="eyebrow px-3 pb-1.5">
            {group.label} · {group.rows.length}
          </h3>
          {group.rows.map((result) => (
            <Link
              key={result.id}
              href={`${result.channel.name ? `/chat/${result.channel.name}` : `/chat/dm/${result.channelId}`}?m=${result.id}`}
              className="group flex gap-3 rounded-lg px-3 py-2.5 hover:bg-hover"
            >
              <Avatar name={result.author?.name ?? "Someone"} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{result.author?.name}</span>{" "}
                  <span className="font-mono text-[11px] text-ink-3">
                    {relativeAgo(result.createdAt)}
                  </span>
                </p>
                <p className="line-clamp-2 text-[15px] leading-6">
                  <MessageBody
                    body={result.body}
                    names={result.names}
                    highlight={words}
                  />
                </p>
              </div>
              <span className="self-center font-mono text-xs text-ink-3 opacity-0 group-hover:opacity-100">
                Jump
              </span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
