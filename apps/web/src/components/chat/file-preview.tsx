"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  FileIcon,
  XIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Dialog, DialogContent, DialogTitle } from "@zentro/ui/shadcn/dialog";

import { fileSize } from "./message-body";
import type { AttachmentView } from "./message-item";

type Info = {
  uploadedBy: string | null;
  createdAt: Date;
  sharedIn: { name: string | null; kind: "channel" | "dm" } | null;
  usedIn: { messages: number };
};

const previewable = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/** A file in the shared gallery: preview, who shared it, and where. */
export function FilePreviewDialog({
  file,
  all,
  onClose,
}: {
  file: AttachmentView;
  all: AttachmentView[];
  onClose: () => void;
}) {
  const trpc = useTrpcClient();
  const [index, setIndex] = useState(
    Math.max(
      0,
      all.findIndex((item) => item.id === file.id),
    ),
  );
  const current = all[index] ?? file;
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    setInfo(null);
    void trpc.files.get
      .query({ id: current.id })
      .then((data) => setInfo(data as Info));
  }, [current.id, trpc]);

  const go = (step: number) =>
    setIndex((value) => (value + step + all.length) % all.length);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(-1);
          if (event.key === "ArrowRight") go(1);
        }}
        className="grid h-[min(640px,90svh)] max-w-[min(1000px,95vw)] grid-cols-1 gap-0 overflow-hidden p-0 sm:max-w-[min(1000px,95vw)] md:grid-cols-[minmax(0,1fr)_300px]"
      >
        <DialogTitle className="sr-only">{current.name}</DialogTitle>
        <div className="relative flex min-h-0 flex-col bg-sunken">
          <div className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 font-mono text-[11px] text-ink-3">
            <span className="flex-1 uppercase">Files preview</span>
            {all.length > 1 ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous file"
                  onClick={() => go(-1)}
                  className="rounded-xs p-0.5 hover:text-ink"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                {index + 1} / {all.length}
                <button
                  type="button"
                  aria-label="Next file"
                  onClick={() => go(1)}
                  className="rounded-xs p-0.5 hover:text-ink"
                >
                  <ChevronRightIcon className="size-4" />
                </button>
              </span>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            {previewable.includes(current.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.name}
                className="max-h-full max-w-full rounded-md object-contain"
              />
            ) : current.mimeType === "application/pdf" ? (
              <iframe
                src={current.url}
                title={current.name}
                sandbox=""
                className="size-full rounded-md border border-hairline bg-surface"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <FileIcon className="size-12 text-ink-3" aria-hidden="true" />
                <p className="text-sm text-ink-2">
                  No preview for this kind of file. Download it to open it.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 overflow-y-auto border-l border-hairline p-5">
          <div className="flex items-start gap-2">
            <h2 className="flex-1 text-xl leading-6 font-semibold break-words">
              {current.name}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close preview"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]">
            <dt className="text-ink-3">Size</dt>
            <dd>
              {fileSize(current.size)}
              {current.width ? ` · ${current.width}×${current.height}` : ""}
            </dd>
            <dt className="text-ink-3">Uploaded by</dt>
            <dd>
              {info
                ? `${info.uploadedBy ?? "Someone"}, ${new Date(info.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "…"}
            </dd>
            <dt className="text-ink-3">Shared in</dt>
            <dd>
              {info?.sharedIn ? (
                info.sharedIn.kind === "dm" ? (
                  "Direct message"
                ) : (
                  <Link
                    href={`/chat/${info.sharedIn.name}`}
                    onClick={onClose}
                    className="text-signal-strong hover:underline"
                  >
                    #{info.sharedIn.name}
                  </Link>
                )
              ) : (
                "…"
              )}
            </dd>
            <dt className="text-ink-3">Used in</dt>
            <dd>
              {info
                ? `${info.usedIn.messages} ${info.usedIn.messages === 1 ? "message" : "messages"}`
                : "…"}
            </dd>
          </dl>
          <div className="mt-auto flex flex-col gap-2">
            <Button asChild>
              <a href={current.url} download={current.name}>
                <DownloadIcon />
                Download
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard
                  .writeText(
                    new URL(current.url, window.location.origin).toString(),
                  )
                  .then(() => toastSuccess("Link copied"));
              }}
            >
              <CopyIcon />
              Copy link
            </Button>
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  );
}
