"use client";

import { formatEventTime } from "@zentro/utils";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarIcon, DownloadIcon, SearchIcon } from "lucide-react";

import { auditCatalog, getAuditEvent } from "@zentro/audit";
import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { EmptyState } from "@zentro/ui/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@zentro/ui/shadcn/sheet";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { sentenceFor } from "~/src/components/workspace/activity/activity-feed";
import { useFrameAction } from "~/src/components/workspace/settings/frames";
import { trpcResult } from "~/src/lib/trpc-result";

type Row = Parameters<typeof sentenceFor>[0] & {
  targetId: string;
  projectId: string | null;
  auditOnly: boolean;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
};

const allValue = "__all__";
const prefixes = Array.from(
  new Set(auditCatalog.map((entry) => `${entry.key.split(".")[0]}.`)),
);

function Diff({ metadata }: { metadata: Record<string, unknown> }) {
  const changes = (metadata.changes ?? []) as Array<{
    field: string;
    from: string | null;
    to: string | null;
  }>;
  const rest = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => key !== "changes"),
  );

  return (
    <div className="flex flex-col gap-3 text-sm">
      {changes.length ? (
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          {(["from", "to"] as const).map((side) => (
            <div
              key={side}
              className="flex min-w-0 flex-col gap-1 rounded-md border border-hairline p-2.5"
            >
              <span className="font-sans text-[11px] text-ink-3">
                {side === "from" ? "Before" : "After"}
              </span>
              {changes.map((change) => (
                <span
                  key={change.field}
                  className={
                    side === "from"
                      ? "break-all text-ink-3 line-through"
                      : "rounded-xs bg-selected px-1 break-all"
                  }
                >
                  {change.field}: {change[side] ?? "none"}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {Object.keys(rest).length ? (
        <pre className="max-h-64 overflow-auto rounded-md border border-hairline bg-sunken p-2.5 text-xs">
          {JSON.stringify(rest, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

const moduleNames: Record<string, string> = {
  task: "Tasks",
  project: "Projects",
  doc: "Docs",
  role: "Roles",
  org: "Org",
  member: "Members",
  invitation: "Members",
  team: "Teams",
  auth: "Auth",
  audit: "Audit",
  module: "Modules",
};

function moduleOf(action: string) {
  const prefix = action.split(".")[0] ?? "";

  return (
    moduleNames[prefix] ?? prefix.charAt(0).toUpperCase() + prefix.slice(1)
  );
}

function clock(date: Date) {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function dayHeading(date: Date) {
  const day = new Date(date);
  const now = new Date();
  const diff = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()) /
      86_400_000,
  );
  const label = day
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();

  return diff === 0
    ? `TODAY · ${label}`
    : diff === 1
      ? `YESTERDAY · ${label}`
      : label;
}

const chip =
  "h-8 shrink-0 gap-1.5 rounded-xl border-hairline bg-transparent px-2.5 text-[13px] shadow-none data-[size=default]:h-8";

export const AuditLog: FC = () => {
  const trpc = useTrpcClient();
  const canExport = usePermission("audit_logs.export");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [actors, setActors] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [actor, setActor] = useState(allValue);
  const [prefix, setPrefix] = useState(allValue);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);

  // Typing waits a moment; the other filters apply at once.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 250);

    return () => clearTimeout(id);
  }, [search]);

  const filter = useCallback(
    () => ({
      actorUserId: actor === allValue ? undefined : actor,
      actionPrefix: prefix === allValue ? undefined : prefix,
      from: from ? new Date(`${from}T00:00:00`) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
      search: debounced.trim() || undefined,
    }),
    [actor, prefix, from, to, debounced],
  );

  const load = useCallback(
    async (next?: string) => {
      const { data, error } = await trpcResult(
        trpc.audit.list.query({ ...filter(), cursor: next }),
      );

      if (error) {
        toastError(error.statusText, error.message);
        setRows([]);

        return;
      }

      setRows((current) =>
        next
          ? [...(current ?? []), ...(data.items as Row[])]
          : (data.items as Row[]),
      );
      setCursor(data.nextCursor);
    },
    [trpc, filter],
  );

  useEffect(() => {
    void load();
    // `reload` re-reads after an export, which is itself an event.
  }, [load, reload]);

  useEffect(() => {
    void trpcResult(trpc.member.getMembers.query()).then(({ data }) =>
      setActors(
        (data ?? []).map((member) => ({
          id: member.userId,
          label: member.name || member.email,
        })),
      ),
    );
  }, [trpc]);

  async function exportCsv() {
    const { data, error } = await trpcResult(
      trpc.audit.export.mutate(filter()),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    const url = URL.createObjectURL(new Blob([data.csv], { type: "text/csv" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = data.filename;
    link.click();
    URL.revokeObjectURL(url);
    setReload((count) => count + 1);
  }

  const groups = useMemo(() => {
    const days: Array<{ label: string; rows: Row[] }> = [];

    for (const row of rows ?? []) {
      const label = dayHeading(row.createdAt);
      const last = days[days.length - 1];

      if (last && last.label === label) last.rows.push(row);
      else days.push({ label, rows: [row] });
    }

    return days;
  }, [rows]);

  const framedExport = useFrameAction(
    canExport ? "Export CSV" : null,
    () => void exportCsv(),
    "export",
  );

  const filtering =
    actor !== allValue || prefix !== allValue || from || to || debounced.trim();

  return (
    <div className="flex flex-col gap-4" data-testid="audit-log">
      {framedExport ? null : (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[22px] leading-7 font-semibold">Audit log</h2>
          <span className="flex-1" />
          {canExport ? (
            <Button variant="outline" onClick={exportCsv}>
              <DownloadIcon />
              Export CSV
            </Button>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative h-8 w-full sm:w-60">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3"
          />
          <input
            id="audit-search"
            aria-label="Search"
            value={search}
            placeholder="Search events"
            onChange={(event) => setSearch(event.target.value)}
            className="h-full w-full rounded-xl border border-hairline bg-surface pr-2.5 pl-8 text-[13px] outline-none placeholder:text-ink-3 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/22"
          />
        </div>

        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger aria-label="Actor" className={chip}>
            <span className="text-ink-3">Actor</span>
            <SelectValue>
              {actor === allValue ? null : (
                <span className="font-medium text-ink">
                  {actors.find((item) => item.id === actor)?.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>Anyone</SelectItem>
            {actors.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={prefix} onValueChange={setPrefix}>
          <SelectTrigger aria-label="Action" className={chip}>
            <span className="text-ink-3">Action</span>
            <SelectValue>
              {prefix === allValue ? null : (
                <span className="font-medium text-ink">{prefix}*</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>All actions</SelectItem>
            {prefixes.map((item) => (
              <SelectItem key={item} value={item}>
                {item}*
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex h-8 items-center gap-1.5 rounded-xl border border-hairline px-2.5 text-[13px]">
          <CalendarIcon className="size-3.5 text-ink-3" aria-hidden="true" />
          <span className="text-ink-3">From</span>
          <input
            id="audit-from"
            type="date"
            aria-label="From"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="bg-transparent font-mono text-xs outline-none"
          />
        </label>
        <label className="flex h-8 items-center gap-1.5 rounded-xl border border-hairline px-2.5 text-[13px]">
          <span className="text-ink-3">To</span>
          <input
            id="audit-to"
            type="date"
            aria-label="To"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="bg-transparent font-mono text-xs outline-none"
          />
        </label>

        <span className="font-mono text-xs text-ink-3">
          {rows ? `${rows.length}${cursor ? "+" : ""} events` : ""}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-xs text-ink-3">
          Every event is kept
        </span>
      </div>

      {!rows ? (
        <div className="flex flex-col gap-1" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-12" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={
            filtering ? "No events match those filters." : "No events yet."
          }
          description={
            filtering
              ? "Widen the dates or clear the search."
              : "Changes made in the organization are recorded here."
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {groups.map((group) => (
            <section
              key={group.label}
              aria-label={group.label}
              className="flex flex-col"
            >
              <h3 className="eyebrow px-3 pt-2 pb-1.5">{group.label}</h3>
              <ol aria-label="Events, newest first">
                {group.rows.map((row) => {
                  const actorLabel =
                    row.actorName ?? row.actorEmail ?? "System";

                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl border-t border-hairline/60 px-3 py-2 text-left outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <time
                          dateTime={new Date(row.createdAt).toISOString()}
                          className="w-[68px] shrink-0 font-mono text-xs text-ink-3"
                        >
                          {clock(row.createdAt)}
                        </time>
                        <ActorAvatar name={actorLabel} size={26} />
                        <span className="min-w-0 flex-1 text-sm break-words">
                          {sentenceFor(row)}
                        </span>
                        <span className="hidden rounded-sm border border-hairline px-1.5 py-px font-mono text-[11px] text-ink-2 sm:block">
                          {moduleOf(row.action)}
                        </span>
                        <span className="hidden w-28 text-right font-mono text-xs text-ink-3 md:block">
                          {row.ip ?? ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {cursor ? (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => load(cursor)}
        >
          Load more
        </Button>
      ) : null}

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <span className="eyebrow">
                  {moduleOf(selected.action)} ·{" "}
                  {getAuditEvent(selected.action)?.label ?? selected.action}
                </span>
                <SheetTitle className="text-lg leading-6">
                  {sentenceFor(selected)}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Details of this event
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-6 text-sm">
                <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]">
                  <dt className="text-ink-3">Actor</dt>
                  <dd className="flex items-center gap-2">
                    <ActorAvatar
                      name={
                        selected.actorName ?? selected.actorEmail ?? "System"
                      }
                      size={20}
                    />
                    {selected.actorName ?? selected.actorEmail ?? "System"}
                  </dd>
                  <dt className="text-ink-3">Time</dt>
                  <dd className="font-mono text-xs">
                    {formatEventTime(selected.createdAt)}
                  </dd>
                  <dt className="text-ink-3">Action</dt>
                  <dd className="font-mono text-xs break-all">
                    {selected.action}
                  </dd>
                  <dt className="text-ink-3">Target</dt>
                  <dd className="break-all">
                    {selected.targetType} {selected.targetLabel ?? ""}
                  </dd>
                  <dt className="text-ink-3">IP address</dt>
                  <dd className="font-mono text-xs">
                    {selected.ip ?? "unknown"}
                  </dd>
                  <dt className="text-ink-3">User agent</dt>
                  <dd className="font-mono text-xs break-all">
                    {selected.userAgent ?? "unknown"}
                  </dd>
                  <dt className="text-ink-3">Request ID</dt>
                  <dd className="font-mono text-xs break-all">
                    {selected.requestId ?? "none"}
                  </dd>
                  <dt className="text-ink-3">Event ID</dt>
                  <dd className="font-mono text-xs break-all">{selected.id}</dd>
                </dl>
                <div className="flex flex-col gap-2">
                  <span className="eyebrow">Change</span>
                  <Diff metadata={selected.metadata} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(JSON.stringify(selected, null, 2))
                        .then(() => toastSuccess("Event copied"));
                    }}
                  >
                    Copy event JSON
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};
