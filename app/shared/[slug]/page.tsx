"use client";

import { useState, useCallback, use } from "react";
import useSWR, { mutate } from "swr";
import {
  BookOpen,
  Languages,
  BookText,
  Library,
  FileText,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/tiptap-editor";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

interface NoteData {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  links: { type: string; ref: string; href: string }[];
  shareMode: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PublicNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const apiUrl = `/api/notes/by-slug/${slug}`;
  const { data: noteData, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  const note: NoteData | null = noteData?.data ?? null;
  const canEdit = note?.shareMode === "edit";

  const handleContentUpdate = useCallback(
    (json: string) => {
      if (!canEdit) return;
      const timer = setTimeout(() => {
        fetch(`/api/notes/by-slug/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: JSON.parse(json) }),
        }).then(() => mutate(apiUrl));
      }, 800);
      return () => clearTimeout(timer);
    },
    [canEdit, slug, apiUrl]
  );

  const [editableTitle, setEditableTitle] = useState<string | null>(null);

  const handleTitleUpdate = useCallback(
    (title: string) => {
      if (!canEdit) return;
      setEditableTitle(title);
      setTimeout(() => {
        fetch(`/api/notes/by-slug/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }).then(() => mutate(apiUrl));
      }, 800);
    },
    [canEdit, slug, apiUrl]
  );

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Not found (also for private notes without auth)
  if (!note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">This note doesn&apos;t exist or isn&apos;t shared.</p>
        <Link href="/" className="text-sm text-gold hover:underline">
          Go to Bible Study →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header */}
      <header className="border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-scripture font-semibold text-gold hover:text-gold/80 transition-colors"
          >
            ✦ Bible Study
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Print note"
            >
              <Printer className="h-4 w-4" />
            </button>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {canEdit ? "Shared (editable)" : "Shared (read-only)"}
            </span>
            {note.isOwner && (
              <Link
                href={`/notes`}
                className="text-xs text-gold hover:underline"
              >
                Open in editor →
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        {canEdit ? (
          <input
            type="text"
            value={editableTitle ?? note.title}
            onChange={(e) => handleTitleUpdate(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-scripture font-bold bg-transparent focus:outline-none mb-2"
            placeholder="Note title..."
          />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-scripture font-bold mb-2">
            {note.title}
          </h1>
        )}

        <p className="text-xs text-muted-foreground mb-6">
          Last updated {new Date(note.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {/* Linked resources */}
        {note.links && note.links.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
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

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-background rounded-xl shadow-border-medium border border-border/50 px-8 md:px-12 py-8 md:py-10 min-h-[50vh] print:shadow-none print:border-0 print:rounded-none">
            {note.content && (note.content as Record<string, unknown>).markdown ? (
              <MarkdownRenderer
                content={(note.content as Record<string, unknown>).markdown as string}
              />
            ) : canEdit ? (
              <TiptapEditor
                content={
                  note.content && Object.keys(note.content).length > 0
                    ? JSON.stringify(note.content)
                    : ""
                }
                onUpdate={handleContentUpdate}
                placeholder="Start writing..."
                className="border-0 rounded-none min-h-[50vh]"
              />
            ) : (
              <div className="text-sm text-muted-foreground italic">
                This note has no content yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
