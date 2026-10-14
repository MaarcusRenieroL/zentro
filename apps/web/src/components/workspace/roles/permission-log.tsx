"use client";

import { formatEventTime } from "@zentro/utils";
import { FC, useCallback, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/shadcn/button";
import { Card, CardContent } from "@zentro/ui/shadcn/card";
import { Label } from "@zentro/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zentro/ui/shadcn/table";
import { toastError } from "@zentro/ui/index";

import { trpcResult } from "~/src/lib/trpc-result";

type LogItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
  actorName: string | null;
};

const allValue = "__all__";

export const PermissionLog: FC = () => {
  const trpc = useTrpcClient();
  const [items, setItems] = useState<LogItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [actors, setActors] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [actorUserId, setActorUserId] = useState<string>(allValue);

  const load = useCallback(
    async (next?: string) => {
      const { data, error } = await trpcResult(
        trpc.permissions.log.list.query({
          limit: 30,
          cursor: next,
          actorUserId: actorUserId === allValue ? undefined : actorUserId,
        }),
      );

      if (error) {
        toastError(error.statusText, error.message);
        setItems([]);

        return;
      }

      setItems((current) =>
        next
          ? [...(current ?? []), ...(data.items as LogItem[])]
          : (data.items as LogItem[]),
      );
      setCursor(data.nextCursor);
    },
    [trpc, actorUserId],
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

  if (!items) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Permission log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every change to roles, assignments, overrides and base roles.
        </p>
      </div>

      <div className="max-w-xs space-y-2">
        <Label>Changed by</Label>
        <Select value={actorUserId} onValueChange={setActorUserId}>
          <SelectTrigger aria-label="Changed by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>Everyone</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatEventTime(item.createdAt)}
                    </TableCell>
                    <TableCell>{item.actorName ?? "Someone"}</TableCell>
                    <TableCell>
                      <span className="font-medium">{item.action}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        ({item.targetType})
                      </span>
                    </TableCell>
                    <TableCell>
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Before and after
                        </summary>
                        <pre className="mt-2 max-w-md overflow-x-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(
                            { before: item.before, after: item.after },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No permission changes yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {cursor ? (
        <Button variant="outline" onClick={() => load(cursor)}>
          Load more
        </Button>
      ) : null}
    </div>
  );
};
