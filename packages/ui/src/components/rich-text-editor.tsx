"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BoldIcon,
  CheckIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  MoreHorizontalIcon,
  HighlighterIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  SaveIcon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react";

import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "../lib/utils";
import { Button } from "./shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./shadcn/dropdown-menu";
import { Input } from "./shadcn/input";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";

type RichTextEditorProps = {
  value: string;
  placeholder?: string;
  maxLength?: number;
  minHeightClassName?: string;
  disabled?: boolean;
  /** Save and Cancel: always, never, or once the text has changed. */
  showActions?: boolean | "dirty";
  onChange?: (value: string) => void;
  onSave: (value: string) => void;
  onCancel?: () => void;
};

const richTextContentClassName =
  "max-w-none text-sm leading-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_a]:text-primary [&_a]:underline [&_mark]:rounded [&_mark]:bg-warning-subtle [&_mark]:px-0.5 [&_mark]:text-warning-text [&_ul[data-type='taskList']]:ml-0 [&_ul[data-type='taskList']]:list-none [&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:gap-2 [&_li[data-type='taskItem']>label]:pt-1 [&>*+*]:mt-3 [&_ul[data-type='taskList']>li]:flex [&_ul[data-type='taskList']>li]:items-start [&_ul[data-type='taskList']>li]:gap-2.5 [&_ul[data-type='taskList']_input]:mt-1 [&_ul[data-type='taskList']_input]:size-4 [&_ul[data-type='taskList']_input]:accent-ink [&_li[data-checked='true']>div]:text-ink-3 [&_li[data-checked='true']>div]:line-through [&_code]:rounded-[6px] [&_code]:bg-hover [&_code]:px-1.5 [&_code]:py-px [&_code]:font-mono [&_code]:text-[13px]";

const editorShellClassName =
  "min-h-24 max-w-none px-3.5 py-3 text-[15px] leading-6 outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:ml-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_mark]:rounded [&_.ProseMirror_mark]:bg-warning-subtle [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:text-warning-text [&_.ProseMirror_ul[data-type='taskList']]:ml-0 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_li[data-type='taskItem']]:flex [&_.ProseMirror_li[data-type='taskItem']]:gap-2 [&_.ProseMirror_li[data-type='taskItem']>label]:pt-1 [&_.ProseMirror>*+*]:mt-3 [&_.ProseMirror_ul[data-type='taskList']>li]:flex [&_.ProseMirror_ul[data-type='taskList']>li]:items-start [&_.ProseMirror_ul[data-type='taskList']>li]:gap-2.5 [&_.ProseMirror_ul[data-type='taskList']_input]:mt-1 [&_.ProseMirror_ul[data-type='taskList']_input]:size-4 [&_.ProseMirror_ul[data-type='taskList']_input]:accent-ink [&_.ProseMirror_li[data-checked='true']>div]:text-ink-3 [&_.ProseMirror_li[data-checked='true']>div]:line-through [&_.ProseMirror_code]:rounded-[6px] [&_.ProseMirror_code]:bg-hover [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-px [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-[13px]";

type RichTextPreviewProps = {
  value: string;
  emptyLabel?: string;
  className?: string;
};

export function RichTextPreview({
  value,
  emptyLabel = "Edit description",
  className,
}: RichTextPreviewProps) {
  if (!value) {
    return (
      <div
        className={cn(
          "min-h-24 rounded-md p-3 text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        richTextContentClassName,
        "min-h-24 rounded-md p-3",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

export function RichTextEditor({
  value,
  placeholder = "Write a clear description...",
  maxLength = 10000,
  minHeightClassName,
  disabled = false,
  showActions = true,
  onChange,
  onSave,
  onCancel,
}: RichTextEditorProps) {
  const [draft, setDraft] = useState(value);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        // Configured on its own below.
        link: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({ placeholder }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      CharacterCount.configure({ limit: maxLength }),
    ],
    [maxLength, placeholder],
  );

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text-editor-content",
      },
    },
    onUpdate({ editor }) {
      const nextValue = editor.getHTML();

      setDraft(nextValue);
      onChange?.(nextValue);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || value === editor.getHTML()) {
      return;
    }

    editor.commands.setContent(value || "");
    setDraft(value);
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-44 animate-pulse rounded-md border bg-muted/40" />
    );
  }

  const characterCount = editor.storage.characterCount.characters();
  // An emptied editor holds "<p></p>", which is no change from "".
  const clean = (html: string) => (html === "<p></p>" ? "" : html);
  const actions =
    showActions === "dirty"
      ? clean(draft) !== clean(value ?? "")
      : Boolean(showActions);
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface">
      <RichTextToolbar editor={editor} disabled={disabled} />
      <EditorContent
        editor={editor}
        className={cn(editorShellClassName, minHeightClassName)}
      />
      {actions || characterCount > maxLength * 0.8 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-3 py-2">
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isOverLimit && "text-destructive",
            )}
          >
            {characterCount.toLocaleString()} / {maxLength.toLocaleString()}{" "}
            characters
          </p>
          {actions ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => {
                  editor.commands.setContent(value || "");
                  setDraft(value);
                  onCancel?.();
                }}
              >
                <XIcon className="size-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={disabled || isOverLimit || draft === value}
                onClick={() => onSave(draft)}
              >
                <SaveIcon className="size-4" />
                Save
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type RichTextToolbarProps = {
  editor: Editor;
  disabled: boolean;
};

/**
 * Six everyday actions stay in view; the rest is behind More. Every command
 * keeps its keyboard shortcut (the editor provides them), so nothing is lost.
 */
function RichTextToolbar({ editor, disabled }: RichTextToolbarProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const applyLink = () => {
    const href = /^(https?:\/\/|mailto:)/.test(url.trim())
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
    setLinkOpen(false);
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex items-center gap-0.5 border-b border-hairline px-1.5 py-1 text-ink-2"
    >
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Checklist"
        active={editor.isActive("taskList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={editor.isActive("code")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("link") ? "secondary" : "ghost"}
            size="icon-sm"
            className="size-8"
            disabled={disabled}
            aria-label="Link"
            title="Link"
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
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
          />
          {urlError ? (
            <p role="alert" className="text-xs text-danger-text">
              {urlError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" type="button" onClick={applyLink}>
              Add link
            </Button>
            {editor.isActive("link") ? (
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkOpen(false);
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <span aria-hidden="true" className="mx-1 h-4 w-px bg-hairline" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="shrink-0 text-ink-2"
          >
            <MoreHorizontalIcon className="size-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <MoreItem
            icon={PilcrowIcon}
            label="Paragraph"
            onSelect={() => editor.chain().focus().setParagraph().run()}
          />
          <MoreItem
            icon={Heading1Icon}
            label="Heading 1"
            onSelect={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          />
          <MoreItem
            icon={Heading2Icon}
            label="Heading 2"
            onSelect={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
          <MoreItem
            icon={Heading3Icon}
            label="Heading 3"
            onSelect={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          />
          <DropdownMenuSeparator />
          <MoreItem
            icon={UnderlineIcon}
            label="Underline"
            hint="Ctrl+U"
            onSelect={() => editor.chain().focus().toggleUnderline().run()}
          />
          <MoreItem
            icon={StrikethroughIcon}
            label="Strikethrough"
            hint="Ctrl+Shift+S"
            onSelect={() => editor.chain().focus().toggleStrike().run()}
          />
          <MoreItem
            icon={HighlighterIcon}
            label="Highlight"
            hint="Ctrl+Shift+H"
            onSelect={() => editor.chain().focus().toggleHighlight().run()}
          />
          <DropdownMenuSeparator />
          <MoreItem
            icon={ListOrderedIcon}
            label="Numbered list"
            onSelect={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <MoreItem
            icon={QuoteIcon}
            label="Quote"
            onSelect={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <MoreItem
            icon={CodeIcon}
            label="Code block"
            onSelect={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <DropdownMenuSeparator />
          <MoreItem
            icon={Undo2Icon}
            label="Undo"
            hint="Ctrl+Z"
            disabled={!editor.can().undo()}
            onSelect={() => editor.chain().focus().undo().run()}
          />
          <MoreItem
            icon={Redo2Icon}
            label="Redo"
            hint="Ctrl+Shift+Z"
            disabled={!editor.can().redo()}
            onSelect={() => editor.chain().focus().redo().run()}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MoreItem({
  icon: Icon,
  label,
  hint,
  disabled,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem disabled={disabled} onSelect={onSelect} className="gap-2">
      <Icon className="size-4" aria-hidden="true" />
      {label}
      {hint ? (
        <span className="ml-auto font-mono text-[11px] text-ink-3">{hint}</span>
      ) : null}
    </DropdownMenuItem>
  );
}

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  children,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className="size-8"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
