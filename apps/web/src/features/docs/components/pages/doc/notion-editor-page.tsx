"use client";

import { paths } from "~/src/lib/paths";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zentro/ui/shadcn/popover";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  CheckIcon,
  ChevronLeftIcon,
  ItalicIcon,
  LinkIcon,
  CheckSquareIcon,
  Code2Icon,
  FileTextIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlusIcon,
  QuoteIcon,
  TableIcon,
  Trash2Icon,
  SquareCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";

import {
  DocDetail,
  formatDocDate,
  getDocOwner,
  getDocProject,
  getDocTitle,
} from "../../../lib/docs";
import { ActorAvatar } from "~/src/components/actor-avatar";
import { StarButton } from "~/src/components/favorites/star-button";
import { LinkedWork } from "~/src/components/links/linked-work";
import { LinkedThread } from "~/src/components/thread/linked-thread";
import {
  useAnyPermission,
  useReachable,
} from "~/src/components/permissions/permission-provider";
import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";
import { ActivityFeed } from "~/src/components/workspace/activity/activity-feed";
import { usePageCrumb } from "~/src/components/shell/breadcrumb-context";
import { CommentsPanel } from "./comments-panel";

const slashCommands = [
  {
    label: "Heading 1",
    hint: "#",
    description: "Big section heading",
    icon: Heading1Icon,
    action: "heading-1",
  },
  {
    label: "Heading 2",
    hint: "##",
    description: "Section heading",
    icon: Heading2Icon,
    action: "heading-2",
  },
  {
    label: "Heading 3",
    hint: "###",
    description: "Nested section heading",
    icon: Heading3Icon,
    action: "heading-3",
  },
  {
    label: "Bullet list",
    hint: "-",
    description: "Create a simple list",
    icon: ListIcon,
    action: "bullet-list",
  },
  {
    label: "Checklist",
    hint: "[ ]",
    description: "Track an action item",
    icon: CheckSquareIcon,
    action: "task-list",
  },
  {
    label: "Quote",
    hint: ">",
    description: "Highlight a decision",
    icon: QuoteIcon,
    action: "quote",
  },
  {
    label: "Code block",
    hint: "```",
    description: "Add a code block",
    icon: Code2Icon,
    action: "code-block",
  },
  {
    label: "Inline code",
    hint: "`",
    description: "Add a short code phrase",
    icon: Code2Icon,
    action: "inline-code",
  },
  {
    label: "Table",
    hint: "",
    description: "Insert a 3 by 3 markdown table",
    icon: TableIcon,
    action: "table",
  },
] as const;

type SlashAction = (typeof slashCommands)[number]["action"];

const headingOptions = [
  {
    label: "H1",
    icon: Heading1Icon,
    level: 1,
  },
  {
    label: "H2",
    icon: Heading2Icon,
    level: 2,
  },
  {
    label: "H3",
    icon: Heading3Icon,
    level: 3,
  },
  {
    label: "H4",
    icon: Heading4Icon,
    level: 4,
  },
  {
    label: "H5",
    icon: Heading5Icon,
    level: 5,
  },
  {
    label: "H6",
    icon: Heading6Icon,
    level: 6,
  },
] as const;

type ToolbarProps = {
  editor: Editor | null;
  canEdit: boolean;
  onAction: (action: SlashAction) => void;
  onHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
};

/** Six everyday actions, and everything else behind More. */
function DocToolbar({ editor, canEdit, onAction, onHeading }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      list: current?.isActive("bulletList") ?? false,
      checklist: current?.isActive("taskList") ?? false,
      code: current?.isActive("code") ?? false,
      link: current?.isActive("link") ?? false,
    }),
  });
  const active = state ?? {
    bold: false,
    italic: false,
    list: false,
    checklist: false,
    code: false,
    link: false,
  };
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  if (!canEdit || !editor) return null;

  const apply = () => {
    const href = /^https?:\/\//.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;

    try {
      new URL(href);
    } catch {
      setUrlError("Enter a web address like https://example.com");

      return;
    }

    setUrlError(null);
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setUrl("");
  };

  const button = (
    label: string,
    Icon: LucideIcon,
    pressed: boolean,
    run: () => void,
  ) => (
    <Button
      key={label}
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={pressed}
      onClick={run}
      className={cn(
        "size-8",
        pressed ? "bg-selected text-signal" : "text-ink-2",
      )}
    >
      <Icon className="size-4" />
    </Button>
  );

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="tile mb-5 flex items-center gap-1 p-1.5"
    >
      {button("Bold", BoldIcon, active.bold, () =>
        editor.chain().focus().toggleBold().run(),
      )}
      {button("Italic", ItalicIcon, active.italic, () =>
        editor.chain().focus().toggleItalic().run(),
      )}
      {button("Bulleted list", ListIcon, active.list, () =>
        onAction("bullet-list"),
      )}
      {button("Checklist", CheckSquareIcon, active.checklist, () =>
        onAction("task-list"),
      )}
      {button("Code", Code2Icon, active.code, () => onAction("inline-code"))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Link"
            aria-pressed={active.link}
            className={cn(
              "size-8",
              active.link ? "bg-selected text-signal" : "text-ink-2",
            )}
          >
            <LinkIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-3">
          <Input
            aria-label="Web address"
            placeholder="https://example.com"
            value={url}
            aria-invalid={Boolean(urlError)}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && apply()}
          />
          {urlError ? (
            <p role="alert" className="text-xs text-danger-text">
              {urlError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={apply}>
              Add link
            </Button>
            {active.link ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-auto text-ink-2">
            <MoreHorizontalIcon className="size-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Headings</DropdownMenuLabel>
          {headingOptions.slice(0, 3).map((option) => (
            <DropdownMenuItem
              key={option.label}
              className="gap-2"
              onClick={() => onHeading(option.level)}
            >
              <option.icon className="size-4" />
              {option.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" onClick={() => onAction("quote")}>
            <QuoteIcon className="size-4" />
            Quote
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => onAction("code-block")}
          >
            <Code2Icon className="size-4" />
            Code block
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => onAction("table")}>
            <TableIcon className="size-4" />
            Table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const docsEditorClassName =
  "min-h-[620px] text-base leading-[26px] outline-none [&_.ProseMirror>*+*]:mt-3 [&_.ProseMirror]:min-h-[620px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:tracking-tight [&_.ProseMirror_h2]:mt-7 [&_.ProseMirror_h2]:mb-0 [&_.ProseMirror_h2]:text-[22px] [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h4]:mt-5 [&_.ProseMirror_h4]:mb-2 [&_.ProseMirror_h4]:text-lg [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h5]:mt-4 [&_.ProseMirror_h5]:mb-2 [&_.ProseMirror_h5]:text-base [&_.ProseMirror_h5]:font-semibold [&_.ProseMirror_h6]:mt-4 [&_.ProseMirror_h6]:mb-2 [&_.ProseMirror_h6]:text-sm [&_.ProseMirror_h6]:font-semibold [&_.ProseMirror_h6]:uppercase [&_.ProseMirror_h6]:text-muted-foreground [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:ml-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:bg-muted/50 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-sm [&_.ProseMirror_table]:my-4 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:bg-muted/60 [&_.ProseMirror_th]:px-3 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:text-left [&_.ProseMirror_td]:border [&_.ProseMirror_td]:px-3 [&_.ProseMirror_td]:py-2 [&_.ProseMirror_ul[data-type='taskList']]:ml-0 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']>li]:flex [&_.ProseMirror_ul[data-type='taskList']>li]:items-start [&_.ProseMirror_ul[data-type='taskList']>li]:gap-2.5 [&_.ProseMirror_ul[data-type='taskList']_input]:mt-[5px] [&_.ProseMirror_ul[data-type='taskList']_input]:size-4 [&_.ProseMirror_ul[data-type='taskList']_input]:accent-ink [&_.ProseMirror_li[data-checked='true']>div]:text-ink-3 [&_.ProseMirror_li[data-checked='true']>div]:line-through [&_.ProseMirror_li+li]:mt-1.5";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInlineMarkdown(value: string) {
  // Code spans are kept verbatim; bold, italic and links work in the rest.
  return escapeHtml(value)
    .split(/(`[^`]+`)/)
    .map((part) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`")
        ? `<code>${part.slice(1, -1)}</code>`
        : part
            .replace(
              /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
              '<a href="$2">$1</a>',
            )
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\*([^*]+)\*/g, "<em>$1</em>"),
    )
    .join("");
}

function parseMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line: string) {
  const cells = parseMarkdownTableRow(line);

  return (
    line.trim().startsWith("|") &&
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let codeLines: string[] = [];
  let isCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (line.startsWith("```")) {
      if (isCodeBlock) {
        html.push(
          `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
        codeLines = [];
      }

      isCodeBlock = !isCodeBlock;
      continue;
    }

    if (isCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      lines[index + 1] &&
      isMarkdownTableSeparator(lines[index + 1] ?? "")
    ) {
      const headers = parseMarkdownTableRow(line);
      const rows: string[][] = [];
      index += 2;

      while (lines[index]?.trim().startsWith("|")) {
        rows.push(parseMarkdownTableRow(lines[index] ?? ""));
        index += 1;
      }

      index -= 1;
      html.push(
        `<table><tbody><tr>${headers
          .map((header) => `<th>${escapeHtml(header)}</th>`)
          .join("")}</tr>${rows
          .map((row) => {
            return `<tr>${headers
              .map((_, cellIndex) => {
                return `<td>${escapeHtml(row[cellIndex] ?? "")}</td>`;
              })
              .join("")}</tr>`;
          })
          .join("")}</tbody></table>`,
      );
      continue;
    }

    if (line.startsWith("# ")) {
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("#### ")) {
      html.push(`<h4>${escapeHtml(line.slice(5))}</h4>`);
      continue;
    }

    if (line.startsWith("##### ")) {
      html.push(`<h5>${escapeHtml(line.slice(6))}</h5>`);
      continue;
    }

    if (line.startsWith("###### ")) {
      html.push(`<h6>${escapeHtml(line.slice(7))}</h6>`);
      continue;
    }

    if (line.startsWith("> ")) {
      html.push(
        `<blockquote><p>${renderInlineMarkdown(line.slice(2))}</p></blockquote>`,
      );
      continue;
    }

    const task = /^- \[([ xX])\] /.exec(line);

    if (task) {
      const checked = task[1] !== " ";

      html.push(
        `<ul data-type="taskList"><li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checked ? " checked" : ""}><span></span></label><div><p>${renderInlineMarkdown(
          line.slice(6),
        )}</p></div></li></ul>`,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      html.push(
        `<ul><li><p>${renderInlineMarkdown(line.slice(2))}</p></li></ul>`,
      );
      continue;
    }

    // A blank line separates blocks; it is not a block of its own.
    if (!line.trim()) {
      continue;
    }

    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  if (isCodeBlock && codeLines.length) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  // Items written one per line belong to one list.
  return html
    .join("")
    .replaceAll("</ul><ul>", "")
    .replaceAll('</ul><ul data-type="taskList">', "");
}

function inlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (!(node instanceof Element)) {
    return "";
  }

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(inlineMarkdown).join("");

  if (tag === "code") {
    return `\`${children}\``;
  }

  if (tag === "strong" || tag === "b") {
    return `**${children}**`;
  }

  if (tag === "em" || tag === "i") {
    return `*${children}*`;
  }

  if (tag === "a") {
    const href = node.getAttribute("href") ?? "";

    return /^(https?:\/\/|mailto:)/.test(href)
      ? `[${children}](${href})`
      : children;
  }

  return children;
}

function blockInlineMarkdown(node: Element) {
  return Array.from(node.childNodes).map(inlineMarkdown).join("").trim();
}

function htmlToMarkdown(html: string) {
  if (typeof window === "undefined") {
    return "";
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: string[] = [];

  doc.body.childNodes.forEach((node) => {
    if (!(node instanceof Element)) {
      return;
    }

    const tag = node.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      blocks.push(
        `${"#".repeat(Number(tag.slice(1)))} ${blockInlineMarkdown(node)}`,
      );
      return;
    }

    if (tag === "blockquote") {
      blocks.push(`> ${blockInlineMarkdown(node)}`);
      return;
    }

    if (tag === "pre") {
      blocks.push(`\`\`\`\n${node.textContent ?? ""}\n\`\`\``);
      return;
    }

    if (tag === "ul" && node.getAttribute("data-type") === "taskList") {
      node.querySelectorAll("li").forEach((item) => {
        const checked = item.getAttribute("data-checked") === "true";
        blocks.push(`- [${checked ? "x" : " "}] ${blockInlineMarkdown(item)}`);
      });
      return;
    }

    if (tag === "ul") {
      node.querySelectorAll(":scope > li").forEach((item) => {
        blocks.push(`- ${blockInlineMarkdown(item)}`);
      });
      return;
    }

    if (tag === "ol") {
      node.querySelectorAll(":scope > li").forEach((item, index) => {
        blocks.push(`${index + 1}. ${blockInlineMarkdown(item)}`);
      });
      return;
    }

    if (tag === "table") {
      const rows = Array.from(node.querySelectorAll("tr")).map((row) => {
        return Array.from(row.querySelectorAll("th,td")).map((cell) =>
          blockInlineMarkdown(cell),
        );
      });
      const [header, ...body] = rows;

      if (header?.length) {
        blocks.push(
          [
            `| ${header.join(" | ")} |`,
            `| ${header.map(() => "---").join(" | ")} |`,
            ...body.map((row) => `| ${row.join(" | ")} |`),
          ].join("\n"),
        );
      }
      return;
    }

    const text = blockInlineMarkdown(node);

    if (text) {
      blocks.push(text);
    }
  });

  return blocks.join("\n\n");
}

export function NotionEditorPage({ slug }: { slug: string }) {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [linksVersion, setLinksVersion] = useState(0);
  const canCreateTask = useReachable("tasks.create");
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  // Open beside the doc on wide screens; on a phone it would cover the page.
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    setCommentsOpen(window.matchMedia("(min-width: 1280px)").matches);
  }, []);
  const [tableRows] = useState(3);
  const [tableColumns] = useState(3);
  const loadedEditorDocIdRef = useRef<string | null>(null);
  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder: "Start typing, or press / for blocks...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [],
  );
  const editor = useEditor({
    extensions: editorExtensions,
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "docs-editor-content",
      },
    },
    onUpdate({ editor }) {
      setContent(htmlToMarkdown(editor.getHTML()));
    },
  });

  usePageCrumb(`/docs/${slug}`, doc ? getDocTitle(doc.title) : null);

  const docResource = {
    projectId: doc?.projectId ?? undefined,
    teamId: doc?.teamId ?? undefined,
    // `_own` edit and trash rights apply to docs the user created.
    ownerUserId: doc?.createdByUserId ?? null,
  };
  const canEdit = useAnyPermission(
    ["docs.update_any", "docs.update_own"],
    docResource,
  );
  const canTrash = useAnyPermission(
    ["docs.trash_any", "docs.trash_own"],
    docResource,
  );
  const canComment = useAnyPermission(["docs.comment"], docResource);

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

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
    if (!editor || !doc) {
      return;
    }

    if (loadedEditorDocIdRef.current === doc.id) {
      return;
    }

    editor.commands.setContent(markdownToHtml(doc.content));
    loadedEditorDocIdRef.current = doc.id;
  }, [doc, editor]);

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
      router.push(paths.docs());
    } catch (error) {
      toastError(error, "Failed to delete doc");
      setIsDeleting(false);
    }
  }

  function removeTypedSlash(currentEditor: Editor) {
    const position = currentEditor.state.selection.from;
    const previousCharacter = currentEditor.state.doc.textBetween(
      Math.max(0, position - 1),
      position,
    );

    if (previousCharacter === "/") {
      currentEditor
        .chain()
        .focus()
        .deleteRange({ from: position - 1, to: position })
        .run();
    }
  }

  function runEditorAction(action: SlashAction, removeSlash = false) {
    if (!editor) {
      return;
    }

    if (removeSlash) {
      removeTypedSlash(editor);
    }

    const chain = editor.chain().focus();

    if (action === "heading-1") {
      chain.toggleHeading({ level: 1 }).run();
    } else if (action === "heading-2") {
      chain.toggleHeading({ level: 2 }).run();
    } else if (action === "heading-3") {
      chain.toggleHeading({ level: 3 }).run();
    } else if (action === "bullet-list") {
      chain.toggleBulletList().run();
    } else if (action === "task-list") {
      chain.toggleTaskList().run();
    } else if (action === "quote") {
      chain.toggleBlockquote().run();
    } else if (action === "code-block") {
      chain.toggleCodeBlock().run();
    } else if (action === "inline-code") {
      chain.toggleCode().run();
    } else if (action === "table") {
      chain
        .insertTable({
          rows: tableRows,
          cols: tableColumns,
          withHeaderRow: true,
        })
        .run();
    }

    setShowSlashMenu(false);
  }

  function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
    editor?.chain().focus().toggleHeading({ level }).run();
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
    <div className="min-h-[calc(100vh-3.5rem)] border-t border-hairline bg-canvas">
      <div className="sticky top-0 z-20 border-b border-hairline bg-canvas/90 backdrop-blur">
        <div className="flex min-h-12 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-2">
            <Link
              href={paths.docs()}
              className="flex items-center gap-1 rounded-xs outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
              Docs
            </Link>
            {doc.projectName ? (
              <span className="hidden truncate text-ink-3 sm:inline">
                / {doc.projectName}
              </span>
            ) : null}
            <span
              role="status"
              className="ml-2 flex items-center gap-1.5 font-mono text-xs text-ink-3"
              suppressHydrationWarning
            >
              {saveStatus === "saving" ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-2 animate-pulse rounded-full bg-status-progress"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="flex size-3.5 items-center justify-center rounded-full bg-success text-on-success"
                  >
                    <CheckIcon className="size-2.5" strokeWidth={3} />
                  </span>
                  Saved{" "}
                  {new Date(doc.updatedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <StarButton
              type="doc"
              id={doc.id}
              title={getDocTitle(title)}
              href={`/docs/${doc.slug}`}
            />
            <Button
              variant="outline"
              size="sm"
              aria-pressed={commentsOpen}
              aria-label={commentsOpen ? "Hide comments" : "Show comments"}
              className={cn(
                "h-8 gap-1.5 border-hairline px-2.5 text-[13px]",
                commentsOpen ? "border-ink bg-hover" : "bg-transparent",
              )}
              onClick={() => setCommentsOpen((isOpen) => !isOpen)}
            >
              <MessageSquareIcon className="size-4" />
              {commentCount ?? ""}
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 text-[13px] font-semibold"
              onClick={() => {
                void navigator.clipboard
                  .writeText(window.location.href)
                  .then(() =>
                    toastSuccess(
                      "Link copied",
                      "Anyone with access can open it.",
                    ),
                  )
                  .catch(() => toastError("Error", "Could not copy the link"));
              }}
            >
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="size-8">
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">Page actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setCommentsOpen((isOpen) => !isOpen)}
                >
                  <MessageSquareIcon className="size-4" />
                  {commentsOpen ? "Hide comments" : "Show comments"}
                </DropdownMenuItem>
                {canCreateTask ? (
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => setCreateTaskOpen(true)}
                  >
                    <SquareCheckIcon className="size-4" />
                    Create task from this doc
                  </DropdownMenuItem>
                ) : null}
                {canTrash ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      disabled={isDeleting}
                      onClick={deleteDoc}
                    >
                      <Trash2Icon className="size-4" />
                      {isDeleting ? "Moving..." : "Move to trash"}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-7rem)] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 bg-canvas">
          <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 lg:py-12">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-[26px] items-center gap-1.5 rounded-sm border border-hairline pr-2 pl-1 text-xs text-ink-2">
                  <span className="flex size-4 items-center justify-center rounded-[5px] bg-tint-projects font-mono text-[8px] text-ink">
                    {getDocProject(doc).charAt(0).toUpperCase()}
                  </span>
                  {getDocProject(doc)}
                </span>
                <span className="inline-flex h-[26px] items-center gap-1.5 rounded-sm border border-hairline pr-2 pl-1 text-xs text-ink-2">
                  <ActorAvatar name={owner} size={18} />
                  {owner}
                </span>
                <span className="inline-flex h-[26px] items-center rounded-sm border border-hairline px-2 font-mono text-xs text-ink-3">
                  Edited {formatDocDate(doc.updatedAt)}
                </span>
              </div>

              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={saveTitle}
                readOnly={!canEdit}
                placeholder="Untitled"
                className="!h-auto border-none bg-transparent px-0 py-0 font-display !text-[2.25rem] !leading-10 shadow-none outline-none focus-visible:ring-0 sm:!text-[2.5rem] sm:!leading-[44px]"
              />
            </div>

            <div className="mt-9">
              <DocToolbar
                editor={editor}
                canEdit={canEdit}
                onAction={(action) => runEditorAction(action)}
                onHeading={setHeading}
              />

              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1 -left-10 hidden opacity-0 group-hover:opacity-100 lg:inline-flex"
                  onClick={() => setShowSlashMenu((isOpen) => !isOpen)}
                >
                  <PlusIcon className="size-4" />
                  <span className="sr-only">Insert block</span>
                </Button>

                {editor ? (
                  <EditorContent
                    editor={editor}
                    onKeyDown={handleEditorKeyDown}
                    className={docsEditorClassName}
                  />
                ) : (
                  <div className="min-h-[620px] animate-pulse rounded-lg bg-muted/40" />
                )}

                {showSlashMenu && (
                  <div
                    role="menu"
                    aria-label="Insert block"
                    className="absolute top-9 left-0 z-10 w-[300px] overflow-hidden rounded-2xl border border-hairline bg-overlay p-1.5 shadow-xl"
                  >
                    <div className="eyebrow px-2.5 pt-2 pb-1 text-[10px]">
                      Basic
                    </div>
                    {slashCommands.map((command) => (
                      <button
                        key={command.label}
                        type="button"
                        role="menuitem"
                        onClick={() => runEditorAction(command.action, true)}
                        className="flex h-9 w-full items-center gap-3 rounded-[10px] px-2 text-left text-sm outline-none hover:bg-hover focus-visible:bg-hover"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-hairline text-ink-2">
                          <command.icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {command.label}
                        </span>
                        {command.hint ? (
                          <span className="font-mono text-[11px] text-ink-3">
                            {command.hint}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <section
            className="mx-auto mt-10 w-full max-w-3xl px-4 pb-10"
            aria-label="Doc activity"
          >
            <h2 className="mb-3 text-sm font-semibold">Activity</h2>
            <ActivityFeed selector={{ targetType: "doc", targetId: doc.id }} />
          </section>
        </main>

        <div className="flex flex-col gap-4 p-6 pl-0 xl:sticky xl:top-16 xl:max-h-[calc(100vh-5rem)] xl:self-start xl:overflow-y-auto max-xl:contents">
          <LinkedWork
            source={{ type: "doc", id: doc.id }}
            selfId={doc.id}
            canEdit={canEdit}
            refreshKey={`${saveStatus}-${linksVersion}`}
          />
          {canCreateTask ? (
            <CreateTaskModal
              hideTrigger
              open={createTaskOpen}
              onOpenChange={setCreateTaskOpen}
              linkDocId={doc.id}
              defaultProjectId={doc.projectId ?? undefined}
              onTaskCreated={() => setLinksVersion((value) => value + 1)}
            />
          ) : null}

          <section aria-label="Thread" className="tile hidden p-4 xl:block">
            <LinkedThread
              header={(count) => (
                <div className="flex items-baseline justify-between pb-3">
                  <h2 className="eyebrow">Thread</h2>
                  <span className="font-mono text-xs text-ink-3">
                    {count} linked
                  </span>
                </div>
              )}
              current={{ kind: "doc", label: getDocTitle(title) }}
              currentId={doc.id}
              projectId={doc.projectId}
              projectName={doc.projectName}
            />
          </section>

          <CommentsPanel
            docId={doc.id}
            canComment={canComment}
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            onCount={setCommentCount}
          />
        </div>
      </div>
    </div>
  );
}
