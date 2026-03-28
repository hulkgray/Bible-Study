"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  LinkIcon,
  Minus,
} from "lucide-react";
import { useCallback, useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onUpdate: (json: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export default function TiptapEditor({
  content,
  onUpdate,
  placeholder = "Start writing your notes...",
  className,
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "bg-gold/20 rounded-sm px-0.5",
        },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-gold underline underline-offset-2 decoration-gold/50 cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground/40 before:float-left before:h-0 before:pointer-events-none",
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content ? JSON.parse(content) : undefined,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
          "prose-headings:font-scripture prose-headings:text-foreground",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:text-foreground/85 prose-p:leading-relaxed",
          "prose-strong:text-foreground prose-em:text-foreground/90",
          "prose-ul:text-foreground/85 prose-ol:text-foreground/85",
          "prose-blockquote:border-gold/40 prose-blockquote:text-foreground/70",
          "prose-code:text-gold prose-code:bg-gold/10 prose-code:rounded prose-code:px-1",
          "prose-a:text-gold prose-a:no-underline hover:prose-a:underline"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onUpdate(json);
    },
    immediatelyRender: false,
  });

  // Re-initialize content when prop changes (i.e., switching notes)
  useEffect(() => {
    if (editor && content) {
      try {
        const parsed = JSON.parse(content);
        const currentJSON = JSON.stringify(editor.getJSON());
        if (content !== currentJSON) {
          editor.commands.setContent(parsed);
        }
      } catch {
        // ignore parse errors
      }
    } else if (editor && !content) {
      editor.commands.clearContent();
    }
  }, [editor, content]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-gold/15 text-gold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );

  const iconSize = "h-3.5 w-3.5";

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-0.5 p-1.5 border-b border-border bg-muted/30 flex-wrap">
          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline Code"
          >
            <Code className={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Lists & blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Link */}
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive("link")}
            title="Insert Link"
          >
            <LinkIcon className={iconSize} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
