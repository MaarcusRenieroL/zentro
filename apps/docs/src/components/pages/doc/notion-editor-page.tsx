"use client";

import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import {
  BracesIcon,
  CheckSquareIcon,
  Code2Icon,
  FileTextIcon,
  Heading1Icon,
  ListIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  SlashIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";

import {
  DocDetail,
  formatDocDate,
  getDocOwner,
  getDocProject,
  getDocTitle,
  getInitials,
} from "../../../lib/docs";
import { CommentsPanel } from "./comments-panel";

const slashCommands = [
  {
    label: "Heading 1",
    description: "Big section heading",
    icon: Heading1Icon,
  },
  {
    label: "Bullet list",
    description: "Create a simple list",
    icon: ListIcon,
  },
  {
    label: "Todo",
    description: "Track an action item",
    icon: CheckSquareIcon,
  },
  {
    label: "Quote",
    description: "Highlight a decision",
    icon: QuoteIcon,
  },
  {
    label: "Code",
    description: "Add a code block",
    icon: Code2Icon,
  },
];

export function NotionEditorPage({ slug }: { slug: string }) {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDoc() {
      try {
        const docData = await trpc.docs.getBySlug.query({ slug });

        if (isMounted) {
          setDoc(docData);
          setTitle(getDocTitle(docData.title));
          setContent(docData.content);
        }
      } catch (error) {
        toastError(error, "Failed to load doc");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDoc();

    return () => {
      isMounted = false;
    };
  }, [slug, trpc]);

  useEffect(() => {
    if (!doc || content === doc.content) {
      return;
    }

    setSaveStatus("saving");

    const timeout = window.setTimeout(async () => {
      try {
        const updatedDoc = await trpc.docs.updateDocContent.mutate({
          id: doc.id,
          content,
        });

        setDoc((currentDoc) =>
          currentDoc
            ? {
                ...currentDoc,
                content: updatedDoc.content,
                updatedAt: updatedDoc.updatedAt,
              }
            : currentDoc,
        );
        setSaveStatus("saved");
      } catch (error) {
        toastError(error, "Failed to save doc content");
        setSaveStatus("saved");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [content, doc, trpc]);

  async function saveTitle() {
    if (!doc || title.trim() === doc.title) {
      return;
    }

    try {
      setSaveStatus("saving");
      const updatedDoc = await trpc.docs.updateDocTitle.mutate({
        id: doc.id,
        title: title.trim() || "Untitled",
      });

      setDoc((currentDoc) =>
        currentDoc
          ? {
              ...currentDoc,
              title: updatedDoc.title,
              updatedAt: updatedDoc.updatedAt,
            }
          : currentDoc,
      );
      setSaveStatus("saved");
    } catch (error) {
      toastError(error, "Failed to save doc title");
      setSaveStatus("saved");
    }
  }

  async function deleteDoc() {
    if (!doc || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await trpc.docs.delete.mutate({ id: doc.id });
      toastSuccess("Doc moved to trash");
      router.push("/docs");
    } catch (error) {
      toastError(error, "Failed to delete doc");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] border-t">
        <main className="min-w-0 flex-1 bg-background">
          <div className="mx-auto max-w-4xl px-6 py-8">
            <div className="mb-8 h-6 w-72 animate-pulse rounded-md bg-muted" />
            <div className="h-12 w-full max-w-2xl animate-pulse rounded-md bg-muted" />
            <div className="mt-10 h-80 animate-pulse rounded-md bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center border-t px-6">
        <div className="max-w-md text-center">
          <FileTextIcon className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Doc not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This doc may have been deleted or moved to another workspace.
          </p>
        </div>
      </div>
    );
  }

  const owner = getDocOwner(doc);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] border-t">
      <main className="min-w-0 flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{getDocProject(doc)}</Badge>
              <span>Edited {formatDocDate(doc.updatedAt)}</span>
              <span className="inline-flex items-center gap-1">
                <BracesIcon className="size-3" />
                {saveStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <MessageSquareIcon className="size-4" />
                Comments
              </Button>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontalIcon className="size-4" />
                <span className="sr-only">Page actions</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isDeleting}
                onClick={deleteDoc}
              >
                <Trash2Icon className="size-4 text-destructive" />
                <span className="sr-only">Move doc to trash</span>
              </Button>
            </div>
          </div>

          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            className="h-auto border-none px-0 py-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="size-6">
              <AvatarFallback>{getInitials(owner)}</AvatarFallback>
            </Avatar>
            <span>{owner}</span>
          </div>

          <div className="mt-10 space-y-5">
            <div className="group flex gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 opacity-0 group-hover:opacity-100"
              >
                <PlusIcon className="size-4" />
              </Button>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write, type / for commands..."
                className="min-h-60 resize-none border-none px-0 text-base leading-7 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="group flex gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 opacity-0 group-hover:opacity-100"
              >
                <PlusIcon className="size-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <PilcrowIcon className="size-4" />
                    Authentication
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Token validation should happen before project scoped data is
                    loaded.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group flex gap-2">
              <Button variant="ghost" size="icon-sm" className="mt-0.5">
                <SlashIcon className="size-4" />
              </Button>
              <Textarea
                defaultValue="/"
                onFocus={() => setShowSlashMenu(true)}
                className="min-h-10 resize-none border-none px-0 text-base leading-7 shadow-none focus-visible:ring-0"
              />

              {showSlashMenu && (
                <div className="absolute top-10 left-10 z-10 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg">
                  <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                    Blocks
                  </div>
                  {slashCommands.map((command) => (
                    <button
                      key={command.label}
                      type="button"
                      onClick={() => setShowSlashMenu(false)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                    >
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <command.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{command.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {command.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <CommentsPanel />
    </div>
  );
}
