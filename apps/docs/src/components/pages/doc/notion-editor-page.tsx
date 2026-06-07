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
  EyeIcon,
  FileTextIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  QuoteIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

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
    markdown: "# Heading",
  },
  {
    label: "Heading 2",
    description: "Section heading",
    icon: Heading2Icon,
    markdown: "## Section",
  },
  {
    label: "Bullet list",
    description: "Create a simple list",
    icon: ListIcon,
    markdown: "- List item",
  },
  {
    label: "Todo",
    description: "Track an action item",
    icon: CheckSquareIcon,
    markdown: "- [ ] Todo item",
  },
  {
    label: "Quote",
    description: "Highlight a decision",
    icon: QuoteIcon,
    markdown: "> Important note",
  },
  {
    label: "Code",
    description: "Add a code block",
    icon: Code2Icon,
    markdown: "```ts\n// Code example\n```",
  },
];

function renderMarkdownPreview(content: string) {
  const nodes: ReactNode[] = [];
  const lines = content.split("\n");
  let codeLines: string[] = [];
  let isCodeBlock = false;

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (isCodeBlock) {
        nodes.push(
          <pre
            key={`code-${index}`}
            className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
        codeLines = [];
      }

      isCodeBlock = !isCodeBlock;
      return;
    }

    if (isCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={index} className="text-3xl font-semibold tracking-tight">
          {line.slice(2)}
        </h1>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={index} className="text-xl font-semibold">
          {line.slice(3)}
        </h2>,
      );
      return;
    }

    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={index}
          className="border-l-2 pl-4 text-muted-foreground"
        >
          {line.slice(2)}
        </blockquote>,
      );
      return;
    }

    if (line.startsWith("- [ ] ")) {
      nodes.push(
        <label key={index} className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled />
          {line.slice(6)}
        </label>,
      );
      return;
    }

    if (line.startsWith("- ")) {
      nodes.push(
        <p
          key={index}
          className="pl-4 text-sm leading-7 before:mr-2 before:content-['•']"
        >
          {line.slice(2)}
        </p>,
      );
      return;
    }

    if (!line.trim()) {
      nodes.push(<div key={index} className="h-3" />);
      return;
    }

    nodes.push(
      <p key={index} className="text-base leading-7">
        {line}
      </p>,
    );
  });

  if (isCodeBlock && codeLines.length) {
    nodes.push(
      <pre
        key="code-open"
        className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
  }

  return nodes;
}

export function NotionEditorPage({ slug }: { slug: string }) {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const previewNodes = useMemo(() => renderMarkdownPreview(content), [content]);

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

  function insertMarkdown(markdown: string) {
    setContent((currentContent) => {
      const trimmedContent = currentContent.endsWith("/")
        ? currentContent.slice(0, -1)
        : currentContent;
      const prefix = trimmedContent.trim() ? "\n\n" : "";

      return `${trimmedContent}${prefix}${markdown}`;
    });
    setMode("write");
    setShowSlashMenu(false);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "/") {
      setShowSlashMenu(true);
    }

    if (event.key === "Escape") {
      setShowSlashMenu(false);
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
                {saveStatus === "saving" ? (
                  <BracesIcon className="size-3" />
                ) : (
                  <SaveIcon className="size-3" />
                )}
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
            <div className="sticky top-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertMarkdown("# Heading")}
                  aria-label="Insert heading"
                >
                  <Heading1Icon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertMarkdown("- List item")}
                  aria-label="Insert list"
                >
                  <ListIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertMarkdown("- [ ] Todo item")}
                  aria-label="Insert todo"
                >
                  <CheckSquareIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertMarkdown("> Important note")}
                  aria-label="Insert quote"
                >
                  <QuoteIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => insertMarkdown("```ts\n// Code example\n```")}
                  aria-label="Insert code"
                >
                  <Code2Icon className="size-4" />
                </Button>
              </div>

              <div className="flex items-center rounded-md border p-1">
                <Button
                  variant={mode === "write" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMode("write")}
                >
                  <PencilIcon className="size-4" />
                  Write
                </Button>
                <Button
                  variant={mode === "preview" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMode("preview")}
                >
                  <EyeIcon className="size-4" />
                  Preview
                </Button>
              </div>
            </div>

            <div className="relative group flex gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="mt-1 opacity-0 group-hover:opacity-100"
                onClick={() => setShowSlashMenu((isOpen) => !isOpen)}
              >
                <PlusIcon className="size-4" />
              </Button>
              <div className="min-w-0 flex-1">
                {mode === "write" ? (
                  <Textarea
                    value={content}
                    onKeyDown={handleEditorKeyDown}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write markdown, type / for blocks..."
                    className="min-h-[520px] resize-none border-none px-0 text-base leading-7 shadow-none focus-visible:ring-0"
                  />
                ) : (
                  <div className="min-h-[520px] space-y-4 rounded-lg border bg-muted/20 p-6">
                    {content.trim() ? (
                      previewNodes
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nothing to preview yet.
                      </p>
                    )}
                  </div>
                )}

                {showSlashMenu && (
                  <div className="absolute top-10 left-10 z-10 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg">
                    <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                      Blocks
                    </div>
                    {slashCommands.map((command) => (
                      <button
                        key={command.label}
                        type="button"
                        onClick={() => insertMarkdown(command.markdown)}
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
        </div>
      </main>

      <CommentsPanel docId={doc.id} />
    </div>
  );
}
