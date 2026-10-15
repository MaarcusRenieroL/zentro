"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { paths } from "~/src/lib/paths";

import { SystemPage } from "./system-page";

function formatStamp(date: Date) {
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${day}, ${time}`;
}

/** 500: an error boundary's view. The request ID is quotable to support. */
export function ServerErrorContent({
  requestId,
  onRetry,
}: {
  requestId?: string;
  onRetry: () => void;
}) {
  // Set after mount so the server and client markup match.
  const [stamp, setStamp] = useState("");

  useEffect(() => setStamp(formatStamp(new Date())), []);

  return (
    <SystemPage
      eyebrow="ERROR 500"
      title="Something broke on our side."
      description="Zentro couldn’t finish loading this page. Your work is safe. This is usually fixed within a few minutes."
      requestId={
        requestId
          ? `Request ID ${requestId}${stamp ? ` · ${stamp}` : ""}`
          : undefined
      }
      actions={
        <>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCwIcon />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href={paths.statusPage} target="_blank" rel="noreferrer">
              Open status page
            </a>
          </Button>
        </>
      }
      footnote={
        <>
          If it keeps happening, send{" "}
          {requestId ? "the request ID" : "this page"} to {paths.supportEmail}.
        </>
      }
    />
  );
}
