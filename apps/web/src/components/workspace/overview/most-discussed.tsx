"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";

import { useReachable } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

type Row = { key: string; name: string; status: string; messages: number };

/** The tasks people have talked about most in chat over the last 30 days. */
export function MostDiscussed() {
  const trpc = useTrpcClient();
  const chat = useReachable("chat.view");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!chat) return;

    let live = true;

    trpc.chat.mostDiscussed
      .query()
      .then((data) => live && setRows(data))
      .catch(() => live && setRows([]));

    return () => {
      live = false;
    };
  }, [trpc, chat]);

  if (!chat) return null;

  return (
    <section
      aria-labelledby="most-discussed"
      className="tile flex flex-col gap-3 p-5"
    >
      <div className="flex items-baseline">
        <h2 id="most-discussed" className="flex-1 font-semibold">
          Most discussed
        </h2>
        <span className="font-mono text-[11px] text-ink-3">last 30 days</span>
      </div>
      {rows === null ? (
        <p className="text-sm text-ink-3">Loading…</p>
      ) : rows.length ? (
        <ol className="flex flex-col">
          {rows.map((row) => (
            <li key={row.key}>
              <Link
                href={paths.task(row.key)}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-hover"
              >
                <StatusGlyph status={row.status} size={13} decorative />
                <span className="font-mono text-xs text-ink-3">{row.key}</span>
                <span className="min-w-0 flex-1 truncate">{row.name}</span>
                <span className="font-mono text-xs text-ink-2">
                  {row.messages} {row.messages === 1 ? "mention" : "mentions"}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-2">
          Nothing yet. Tasks named in chat messages show up here.
        </p>
      )}
    </section>
  );
}
