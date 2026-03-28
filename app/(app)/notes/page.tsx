"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import {
  Plus,
  FolderPlus,
  Folder,
  FileText,
  Pin,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Search,
  MoreVertical,
  Palette,
  FolderInput,
  BookOpen,
  Languages,
  BookText,
  Library,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/tiptap-editor";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Color palette for notes/folders
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

const COLOR_BG: Record<string, string> = {
  default: "bg-card",
  gold: "bg-amber-950/30",
  coral: "bg-red-950/30",
  lavender: "bg-purple-950/30",
  sage: "bg-emerald-950/30",
  sky: "bg-blue-950/30",
  rose: "bg-pink-950/30",
  peach: "bg-orange-950/30",
};

const COLOR_BORDER: Record<string, string> = {
  default: "border-border",
  gold: "border-amber-700/30",
  coral: "border-red-700/30",
  lavender: "border-purple-700/30",
  sage: "border-emerald-700/30",
  sky: "border-blue-700/30",
  rose: "border-pink-700/30",
  peach: "border-orange-700/30",
};

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

interface NoteData {
  id: string;
  title: string;
  content: Record<string, unknown>;
  folderId: string | null;
  color: string;
  pinned: boolean;
  links: { type: string; ref: string; href: string }[];
  createdAt: string;
  updatedAt: string;
}

interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

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

export default function NotesPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState<string | null>(null);

  // SWR hooks
  const notesUrl = searchQuery
    ? `/api/notes?search=${encodeURIComponent(searchQuery)}`
    : currentFolderId
      ? `/api/notes?folderId=${currentFolderId}`
      : "/api/notes";

  const { data: notesData } = useSWR(notesUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  const { data: foldersData } = useSWR("/api/notes/folders", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const { data: noteDetailData } = useSWR(
    selectedNoteId ? `/api/notes/${selectedNoteId}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );

  const notes: NoteData[] = notesData?.data ?? [];
  const folders: FolderData[] = foldersData?.data ?? [];
  const selectedNote: NoteData | null = noteDetailData?.data ?? null;

  // Get current folder info
  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  // Filter folders for current view
  const visibleFolders = folders.filter((f) =>
    currentFolderId ? f.parentId === currentFolderId : !f.parentId
  );

  // ============================================
  // CRUD Actions
  // ============================================

  const createNote = useCallback(async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled Note",
        folderId: currentFolderId,
      }),
    });
    const data = await res.json();
    if (data.data) {
      setSelectedNoteId(data.data.id);
      mutate(notesUrl);
    }
  }, [currentFolderId, notesUrl]);

  const createFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await fetch("/api/notes/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFolderName.trim(),
        parentId: currentFolderId,
      }),
    });
    setNewFolderName("");
    setShowNewFolder(false);
    mutate("/api/notes/folders");
  }, [newFolderName, currentFolderId]);

  const updateNote = useCallback(
    async (id: string, updates: Partial<NoteData>) => {
      await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      mutate(`/api/notes/${id}`);
      mutate(notesUrl);
    },
    [notesUrl]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (selectedNoteId === id) setSelectedNoteId(null);
      mutate(notesUrl);
    },
    [notesUrl, selectedNoteId]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await fetch(`/api/notes/folders/${id}`, { method: "DELETE" });
      if (currentFolderId === id) setCurrentFolderId(null);
      mutate("/api/notes/folders");
      mutate(notesUrl);
    },
    [currentFolderId, notesUrl]
  );

  const moveNote = useCallback(
    async (noteId: string, folderId: string | null) => {
      await updateNote(noteId, { folderId } as Partial<NoteData>);
      setShowMoveMenu(null);
      mutate(notesUrl);
    },
    [updateNote, notesUrl]
  );

  // Debounced content save
  const handleContentUpdate = useCallback(
    (json: string) => {
      if (!selectedNoteId) return;
      // Debounce: save after a short delay
      const timer = setTimeout(() => {
        updateNote(selectedNoteId, { content: JSON.parse(json) } as unknown as Partial<NoteData>);
      }, 800);
      return () => clearTimeout(timer);
    },
    [selectedNoteId, updateNote]
  );

  const handleTitleUpdate = useCallback(
    (title: string) => {
      if (!selectedNoteId) return;
      updateNote(selectedNoteId, { title } as Partial<NoteData>);
    },
    [selectedNoteId, updateNote]
  );

  // ============================================
  // Render
  // ============================================

  // If a note is selected, show the editor
  if (selectedNote) {
    return (
      <div className="h-full flex flex-col">
        {/* Editor header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            onClick={() => setSelectedNoteId(null)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={selectedNote.title}
            onChange={(e) => handleTitleUpdate(e.target.value)}
            className="flex-1 bg-transparent text-lg font-scripture font-semibold focus:outline-none"
            placeholder="Note title..."
          />

          <div className="flex items-center gap-1">
            {/* Pin */}
            <button
              onClick={() =>
                updateNote(selectedNote.id, { pinned: !selectedNote.pinned } as Partial<NoteData>)
              }
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                selectedNote.pinned
                  ? "text-gold bg-gold/10"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={selectedNote.pinned ? "Unpin" : "Pin"}
            >
              <Pin className="h-4 w-4" />
            </button>

            {/* Color picker */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowColorPicker(
                    showColorPicker === selectedNote.id ? null : selectedNote.id
                  )
                }
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                title="Change color"
              >
                <Palette className="h-4 w-4" />
              </button>
              {showColorPicker === selectedNote.id && (
                <div className="absolute right-0 top-full mt-1 p-2 rounded-lg bg-popover border border-border shadow-lg z-50 flex gap-1.5">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        updateNote(selectedNote.id, { color: c.value } as Partial<NoteData>);
                        setShowColorPicker(null);
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                        COLOR_DOT[c.value],
                        selectedNote.color === c.value
                          ? "border-white scale-110"
                          : "border-transparent"
                      )}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm("Delete this note?")) deleteNote(selectedNote.id);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Linked resources */}
        {selectedNote.links && selectedNote.links.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Linked:
            </span>
            {selectedNote.links.map((link, i) => {
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

        {/* Note content — markdown renderer for AI exports, Tiptap for manual notes */}
        <div className="flex-1 overflow-y-auto">
          {selectedNote.content && (selectedNote.content as Record<string, unknown>).markdown ? (
            <div className="px-6 py-4 prose-note">
              <MarkdownRenderer
                content={(selectedNote.content as Record<string, unknown>).markdown as string}
              />
            </div>
          ) : (
            <TiptapEditor
              content={
                selectedNote.content && Object.keys(selectedNote.content).length > 0
                  ? JSON.stringify(selectedNote.content)
                  : ""
              }
              onUpdate={handleContentUpdate}
              placeholder="Start writing your study notes..."
              className="border-0 rounded-none min-h-full"
            />
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // Notes List View
  // ============================================
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            {currentFolder && (
              <button
                onClick={() => setCurrentFolderId(currentFolder.parentId)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-scripture font-semibold">
              {currentFolder ? currentFolder.name : "Study Notes"}
            </h1>
          </div>
          {!currentFolder && (
            <p className="text-muted-foreground text-sm mt-1">
              Rich text notes with linked Scripture references
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Folder</span>
          </button>
          <button
            onClick={createNote}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-gold text-gold-foreground hover:bg-gold/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4 animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 mb-4 animate-slide-up">
          <Folder className="h-4 w-4 text-gold" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            placeholder="Folder name..."
            className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            autoFocus
          />
          <button
            onClick={createFolder}
            className="px-3 py-2 rounded-lg bg-gold text-gold-foreground text-xs font-medium"
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName("");
            }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Folders */}
      {!searchQuery && visibleFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6 animate-slide-up">
          {visibleFolders.map((folder) => (
            <div
              key={folder.id}
              className="group relative"
            >
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-3 rounded-xl border transition-all hover:shadow-sm",
                  COLOR_BG[folder.color] ?? COLOR_BG.default,
                  COLOR_BORDER[folder.color] ?? COLOR_BORDER.default,
                  "hover:border-gold/20"
                )}
              >
                <Folder className="h-5 w-5 text-gold/70 shrink-0" />
                <span className="text-sm font-medium truncate">{folder.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
              </button>

              {/* Folder delete (hidden until hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete folder "${folder.name}"? Notes will be moved to root.`))
                    deleteFolder(folder.id);
                }}
                className="absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-slide-up">
          {notes.map((note, i) => {
            // Extract plain text from Tiptap JSON structure
            const extractText = (node: Record<string, unknown>): string => {
              if (!node) return "";
              if (node.type === "text" && typeof node.text === "string") return node.text;
              if (Array.isArray(node.content)) {
                return (node.content as Record<string, unknown>[])
                  .map(extractText)
                  .join(" ");
              }
              return "";
            };
            const textContent = extractText(note.content);

            return (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "group relative cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md hover:border-gold/20",
                  COLOR_BG[note.color] ?? COLOR_BG.default,
                  COLOR_BORDER[note.color] ?? COLOR_BORDER.default
                )}
                style={{
                  animationDelay: `${i * 30}ms`,
                  animationFillMode: "both",
                }}
              >
                {/* Pin indicator */}
                {note.pinned && (
                  <Pin className="absolute top-2.5 right-2.5 h-3 w-3 text-gold rotate-45" />
                )}

                {/* Title */}
                <h3 className="text-sm font-semibold mb-1.5 line-clamp-1 pr-6">
                  {note.title || "Untitled Note"}
                </h3>

                {/* Content preview */}
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                  {textContent.substring(0, 120) || "Empty note"}
                </p>

                {/* Linked resources */}
                {note.links && note.links.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {note.links.slice(0, 3).map((link, linkIdx) => {
                      const Icon = LINK_ICONS[link.type] ?? BookOpen;
                      return (
                        <span
                          key={`${link.type}-${linkIdx}`}
                          className={cn(
                            "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-card/50",
                            LINK_COLORS[link.type]
                          )}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {link.ref}
                        </span>
                      );
                    })}
                    {note.links.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{note.links.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>

                  {/* Actions (hover) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoveMenu(showMoveMenu === note.id ? null : note.id);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Move to folder"
                    >
                      <FolderInput className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNote(note.id, { pinned: !note.pinned } as Partial<NoteData>);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title={note.pinned ? "Unpin" : "Pin"}
                    >
                      <Pin
                        className={cn(
                          "h-3 w-3",
                          note.pinned ? "text-gold" : "text-muted-foreground"
                        )}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this note?")) deleteNote(note.id);
                      }}
                      className="p-1 rounded hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Move-to-folder dropdown */}
                {showMoveMenu === note.id && (
                  <div
                    className="absolute right-2 bottom-8 z-50 w-48 p-1.5 rounded-lg bg-popover border border-border shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-semibold">
                      Move to
                    </p>
                    <button
                      onClick={() => moveNote(note.id, null)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-left",
                        !note.folderId && "text-gold"
                      )}
                    >
                      <FileText className="h-3 w-3" />
                      Root
                    </button>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => moveNote(note.id, f.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-left",
                          note.folderId === f.id && "text-gold"
                        )}
                      >
                        <Folder className="h-3 w-3" />
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground animate-fade-in">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">
            {searchQuery
              ? `No notes matching "${searchQuery}"`
              : "No notes yet. Create your first note!"}
          </p>
          <button
            onClick={createNote}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-gold-foreground text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      )}
    </div>
  );
}
