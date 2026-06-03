"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BoldIcon,
  CheckIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
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
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "../lib/utils";
import { Button } from "./shadcn/button";
import { Separator } from "./shadcn/separator";

type RichTextEditorProps = {
  value: string;
  placeholder?: string;
  maxLength?: number;
  minHeightClassName?: string;
  disabled?: boolean;
  showActions?: boolean;
  onChange?: (value: string) => void;
  onSave: (value: string) => void;
  onCancel?: () => void;
};

const richTextContentClassName =
  "max-w-none text-sm leading-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_a]:text-primary [&_a]:underline [&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-yellow-950 [&_ul[data-type='taskList']]:ml-0 [&_ul[data-type='taskList']]:list-none [&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:gap-2 [&_li[data-type='taskItem']>label]:pt-1";

const editorShellClassName =
  "min-h-44 max-w-none px-3 py-3 text-sm leading-6 outline-none [&_.ProseMirror]:min-h-36 [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:ml-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_mark]:rounded [&_.ProseMirror_mark]:bg-yellow-200 [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:text-yellow-950 [&_.ProseMirror_ul[data-type='taskList']]:ml-0 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_li[data-type='taskItem']]:flex [&_.ProseMirror_li[data-type='taskItem']]:gap-2 [&_.ProseMirror_li[data-type='taskItem']>label]:pt-1";

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
      Underline,
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
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="overflow-hidden rounded-md border bg-background shadow-xs">
      <RichTextToolbar editor={editor} disabled={disabled} />
      <EditorContent
        editor={editor}
        className={cn(editorShellClassName, minHeightClassName)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
        <p
          className={cn(
            "text-xs text-muted-foreground",
            isOverLimit && "text-destructive",
          )}
        >
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()}{" "}
          characters
        </p>
        {showActions ? (
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
    </div>
  );
}

type RichTextToolbarProps = {
  editor: Editor;
  disabled: boolean;
};

function RichTextToolbar({ editor, disabled }: RichTextToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
      <ToolbarButton
        label="Paragraph"
        active={editor.isActive("paragraph")}
        disabled={disabled}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <PilcrowIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3Icon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

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
        label="Underline"
        active={editor.isActive("underline")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Highlight"
        active={editor.isActive("highlight")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <HighlighterIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Task list"
        active={editor.isActive("taskList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuoteIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        disabled={disabled}
        onClick={() => setLink(editor)}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Undo"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2Icon className="size-4" />
      </ToolbarButton>
    </div>
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
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function setLink(editor: Editor) {
  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Link URL", previousUrl ?? "");

  if (url === null) {
    return;
  }

  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}
