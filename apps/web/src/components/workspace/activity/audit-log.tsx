"use client";

import { FC, useCallback, useEffect, useState } from "react";

import { auditCatalog, getAuditEvent } from "@zentro/audit";
import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Card, CardContent } from "@zentro/ui/shadcn/card";
import { Input } from "@zentro/ui/shadcn/input";
import { Label } from "@zentro/ui/shadcn/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zentro/ui/shadcn/table";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { sentenceFor } from "~/src/components/workspace/activity/activity-feed";
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
    <div className="space-y-3 text-sm">
      {changes.length ? (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pr-2">Field</th>
              <th className="pr-2">Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={change.field} className="align-top">
                <td className="pr-2 font-medium">{change.field}</td>
                <td className="pr-2 text-destructive break-all">
                  {change.from ?? "none"}
                </td>
                <td className="break-all text-emerald-600">
                  {change.to ?? "none"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {Object.keys(rest).length ? (
        <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(rest, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

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
  const [applied, setApplied] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);

  const filter = useCallback(
    () => ({
      actorUserId: actor === allValue ? undefined : actor,
      actionPrefix: prefix === allValue ? undefined : prefix,
      from: from ? new Date(`${from}T00:00:00`) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
      search: search.trim() || undefined,
    }),
    [actor, prefix, from, to, search],
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
    // Filters apply when "Apply" is pressed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trpc, applied],
  );

  useEffect(() => {
    void load();
  }, [load]);

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
    // The export is itself an audit event.
    setApplied((count) => count + 1);
  }

  return (
    <div className="space-y-4" data-testid="audit-log">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Audit log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every recorded event in the organization, including sign-ins and
            permission changes.
          </p>
        </div>
        {canExport ? (
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label>Actor</Label>
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger aria-label="Actor">
              <SelectValue />
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
        </div>
        <div className="space-y-1">
          <Label>Action</Label>
          <Select value={prefix} onValueChange={setPrefix}>
            <SelectTrigger aria-label="Action">
              <SelectValue />
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
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-from">From</Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-to">To</Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-search">Search</Label>
          <Input
            id="audit-search"
            value={search}
            placeholder="Name or action"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && setApplied((count) => count + 1)
            }
          />
        </div>
      </div>
      <Button onClick={() => setApplied((count) => count + 1)}>
        Apply filters
      </Button>

      {!rows ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(row)}
                    >
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-normal break-words">
                        {sentenceFor(row)}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({row.action})
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No events match.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {cursor ? (
        <Button variant="outline" onClick={() => load(cursor)}>
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
                <SheetTitle>
                  {getAuditEvent(selected.action)?.label ?? selected.action}
                </SheetTitle>
                <SheetDescription>{sentenceFor(selected)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6 text-sm">
                <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Time</dt>
                  <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
                  <dt className="text-muted-foreground">Action</dt>
                  <dd className="break-all">{selected.action}</dd>
                  <dt className="text-muted-foreground">Target</dt>
                  <dd className="break-all">
                    {selected.targetType} {selected.targetLabel ?? ""} (
                    {selected.targetId})
                  </dd>
                  <dt className="text-muted-foreground">IP</dt>
                  <dd>{selected.ip ?? "unknown"}</dd>
                  <dt className="text-muted-foreground">User agent</dt>
                  <dd className="break-all">
                    {selected.userAgent ?? "unknown"}
                  </dd>
                  <dt className="text-muted-foreground">Request</dt>
                  <dd className="break-all">{selected.requestId ?? "none"}</dd>
                </dl>
                <Diff metadata={selected.metadata} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};
