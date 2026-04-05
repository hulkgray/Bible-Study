"use client";

import { useState, useCallback, use } from "react";
import useSWR, { mutate } from "swr";
import {
  ArrowLeft,
  Pin,
  Palette,
  Trash2,
  Share2,
  Copy,
  Check,
  BookOpen,
  Languages,
  BookText,
  Library,
  Globe,
  Lock,
  Pencil,
  X,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/tiptap-editor";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const NOTE_COLORS = [
  { name: "Default", value: "default" },
  { name: "Gold", value: "gold" },
  { name: "Coral", value: "coral" },
  { name: "Lavender", value: "lavender" },
  { name: "Sage", value: "sage" },
  { name: "Sky", value: "sky" },
  { name: "Rose", value: "rose" },
  { name: "Peach", value: "peach" },
];

const COLOR_DOT: Record<string, string> = {
  default: "bg-muted-foreground",
  gold: "bg-amber-500",
  coral: "bg-red-500",
  lavender: "bg-purple-500",
  sage: "bg-emerald-500",
  sky: "bg-blue-500",
  rose: "bg-pink-500",
  peach: "bg-orange-500",
};

const LINK_ICONS: Record<string, typeof BookOpen> = {
  verse: BookOpen,
  strongs: Languages,
  dictionary: BookText,
  library: Library,
};

const LINK_COLORS: Record<string, string> = {
  verse: "text-amber-500",
  strongs: "text-emerald-400",
  dictionary: "text-purple-400",
  library: "text-blue-400",
};

const SHARE_OPTIONS = [
  { mode: "private", label: "Private", icon: Lock, desc: "Only you can access" },
  { mode: "view", label: "Anyone with link can view", icon: Globe, desc: "Read-only access" },
  { mode: "edit", label: "Anyone with link can edit", icon: Pencil, desc: "Full edit access" },
] as const;

interface NoteData {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  folderId: string | null;
  color: string;
  pinned: boolean;
  links: { type: string; ref: string; href: string }[];
  shareMode: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const apiUrl = `/api/notes/by-slug/${slug}`;

  const { data: noteData, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  const note: NoteData | null = noteData?.data ?? null;

  const updateNote = useCallback(
    async (updates: Partial<NoteData>) => {
      if (!note) return;
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      mutate(apiUrl);
    },
    [note, apiUrl]
  );

  const deleteNote = useCallback(async () => {
    if (!note) return;
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    router.push("/notes");
  }, [note, router]);

  const handleContentUpdate = useCallback(
    (json: string) => {
      if (!note) return;
      const timer = setTimeout(() => {
        updateNote({ content: JSON.parse(json) } as unknown as Partial<NoteData>);
      }, 800);
      return () => clearTimeout(timer);
    },
    [note, updateNote]
  );

  const handleTitleUpdate = useCallback(
    (title: string) => {
      if (!note) return;
      updateNote({ title } as Partial<NoteData>);
    },
    [note, updateNote]
  );

  const copyShareLink = useCallback(() => {
    if (!note) return;
    const url = `${window.location.origin}/shared/${note.slug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [note]);

  const updateShareMode = useCallback(
    async (mode: string) => {
      if (!note) return;
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareMode: mode }),
      });
      mutate(apiUrl);
    },
    [note, apiUrl]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Note not found</p>
        <button
          onClick={() => router.push("/notes")}
          className="text-sm text-gold hover:underline"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 print:hidden">
        <button
          onClick={() => router.push("/notes")}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <input
          type="text"
          value={note.title}
          onChange={(e) => handleTitleUpdate(e.target.value)}
          className="flex-1 bg-transparent text-lg font-scripture font-semibold focus:outline-none"
          placeholder="Note title..."
        />

        <div className="flex items-center gap-1">
          {/* Share */}
          <div className="relative">
            <button
              onClick={() => setShowShareDialog(!showShareDialog)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                note.shareMode !== "private"
                  ? "text-gold bg-gold/10"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {showShareDialog && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-popover border border-border shadow-xl z-50 p-4 animate-slide-down">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Share Note</h3>
                  <button
                    onClick={() => setShowShareDialog(false)}
                    className="p-1 rounded hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-1.5 mb-4">
                  {SHARE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.mode}
                        onClick={() => updateShareMode(opt.mode)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                          note.shareMode === opt.mode
                            ? "bg-gold/10 border border-gold/20 text-gold"
                            : "hover:bg-muted border border-transparent"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {note.shareMode !== "private" && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs font-mono text-muted-foreground truncate">
                      {typeof window !== "undefined" ? `${window.location.origin}/shared/${note.slug}` : `/shared/${note.slug}`}
                    </div>
                    <button
                      onClick={copyShareLink}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gold text-gold-foreground text-xs font-medium hover:bg-gold/90 transition-colors"
                    >
                      {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {linkCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pin */}
          <button
            onClick={() =>
              updateNote({ pinned: !note.pinned } as Partial<NoteData>)
            }
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              note.pinned
                ? "text-gold bg-gold/10"
                : "text-muted-foreground hover:bg-muted"
            )}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin className="h-4 w-4" />
          </button>

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Change color"
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1 p-2 rounded-lg bg-popover border border-border shadow-lg z-50 flex gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      updateNote({ color: c.value } as Partial<NoteData>);
                      setShowColorPicker(false);
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      COLOR_DOT[c.value],
                      note.color === c.value
                        ? "border-white scale-110"
                        : "border-transparent"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            title="Print note"
          >
            <Printer className="h-4 w-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm("Delete this note?")) deleteNote();
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Linked resources */}
      {note.links && note.links.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20 flex-wrap print:hidden">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Linked:
          </span>
          {note.links.map((link, i) => {
            const Icon = LINK_ICONS[link.type] ?? BookOpen;
            return (
              <Link
                key={`${link.type}-${link.ref}-${i}`}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-card border border-border hover:border-gold/30 transition-colors",
                  LINK_COLORS[link.type]
                )}
              >
                <Icon className="h-3 w-3" />
                {link.ref}
              </Link>
            );
          })}
        </div>
      )}

      {/* Note content — page-view layout with constrained width */}
      <div className="flex-1 overflow-y-auto bg-muted/20 print:bg-white">
        <div className="max-w-3xl mx-auto my-6 md:my-10 bg-background rounded-xl shadow-border-medium border border-border/50 min-h-[70vh] print:shadow-none print:border-0 print:my-0 print:rounded-none">
          <TiptapEditor
            content={(() => {
              if (!note.content || Object.keys(note.content).length === 0) return "";
              // If content has a markdown field (AI export), convert to Tiptap JSON
              const c = note.content as Record<string, unknown>;
              if (c.markdown && typeof c.markdown === "string") {
                // Convert markdown paragraphs to Tiptap doc structure
                const paragraphs = (c.markdown as string).split(/\n\n+/).filter(Boolean);
                const tiptapDoc = {
                  type: "doc",
                  content: paragraphs.map((p) => ({
                    type: "paragraph",
                    content: [{ type: "text", text: p.replace(/\n/g, " ") }],
                  })),
                };
                return JSON.stringify(tiptapDoc);
              }
              return JSON.stringify(note.content);
            })()}
            onUpdate={handleContentUpdate}
            placeholder="Start writing your study notes..."
            className="border-0 rounded-none min-h-[60vh] px-8 md:px-12 py-8 md:py-10"
          />
        </div>
      </div>
    </div>
  );
}
