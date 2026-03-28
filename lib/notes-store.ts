/**
 * notes-store.ts — Google Notes-style file system for study notes.
 *
 * All data persists in localStorage with folder/note hierarchy.
 * Notes use Tiptap JSON for rich text content.
 */

// ============================================
// Types
// ============================================

export type LinkedResourceType = "verse" | "dictionary" | "strongs" | "library" | "devotional";

export interface ResourceLink {
  type: LinkedResourceType;
  ref: string;
  href: string;
}

export interface NoteFile {
  id: string;
  type: "note";
  title: string;
  /** Tiptap JSON content */
  content: string;
  /** Linked Bible resources */
  links: ResourceLink[];
  /** Parent folder ID (null = root) */
  folderId: string | null;
  /** Note accent color */
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFolder {
  id: string;
  type: "folder";
  name: string;
  /** Parent folder ID (null = root level) */
  parentId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteItem = NoteFile | NoteFolder;

// ============================================
// Color Palette for notes/folders
// ============================================
export const NOTE_COLORS = [
  { name: "Default", value: "default" },
  { name: "Gold", value: "gold" },
  { name: "Coral", value: "coral" },
  { name: "Lavender", value: "lavender" },
  { name: "Sage", value: "sage" },
  { name: "Sky", value: "sky" },
  { name: "Rose", value: "rose" },
  { name: "Peach", value: "peach" },
] as const;

export const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  default: { bg: "bg-card", border: "border-border", text: "text-foreground" },
  gold: { bg: "bg-amber-950/30", border: "border-amber-700/30", text: "text-amber-200" },
  coral: { bg: "bg-red-950/30", border: "border-red-700/30", text: "text-red-200" },
  lavender: { bg: "bg-purple-950/30", border: "border-purple-700/30", text: "text-purple-200" },
  sage: { bg: "bg-emerald-950/30", border: "border-emerald-700/30", text: "text-emerald-200" },
  sky: { bg: "bg-blue-950/30", border: "border-blue-700/30", text: "text-blue-200" },
  rose: { bg: "bg-pink-950/30", border: "border-pink-700/30", text: "text-pink-200" },
  peach: { bg: "bg-orange-950/30", border: "border-orange-700/30", text: "text-orange-200" },
};

// ============================================
// Storage
// ============================================
const STORAGE_KEY = "bible-study-notes-v2";

interface NotesStore {
  notes: NoteFile[];
  folders: NoteFolder[];
}

function getStore(): NotesStore {
  if (typeof window === "undefined") return { notes: [], folders: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { notes: [], folders: [] };
  } catch {
    return { notes: [], folders: [] };
  }
}

function saveStore(store: NotesStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("[NotesStore] Save failed:", e);
  }
}

// ============================================
// Folder CRUD
// ============================================

export function getFolders(parentId: string | null = null): NoteFolder[] {
  const store = getStore();
  return store.folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllFolders(): NoteFolder[] {
  return getStore().folders.sort((a, b) => a.name.localeCompare(b.name));
}

export function getFolder(id: string): NoteFolder | undefined {
  return getStore().folders.find((f) => f.id === id);
}

export function createFolder(
  name: string,
  parentId: string | null = null,
  color = "default"
): NoteFolder {
  const store = getStore();
  const folder: NoteFolder = {
    id: crypto.randomUUID(),
    type: "folder",
    name,
    parentId,
    color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.folders.push(folder);
  saveStore(store);
  return folder;
}

export function updateFolder(
  id: string,
  updates: Partial<Pick<NoteFolder, "name" | "parentId" | "color">>
): NoteFolder | null {
  const store = getStore();
  const idx = store.folders.findIndex((f) => f.id === id);
  if (idx === -1) return null;

  store.folders[idx] = {
    ...store.folders[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.folders[idx];
}

export function deleteFolder(id: string): boolean {
  const store = getStore();
  // Move all notes in this folder to root
  store.notes = store.notes.map((n) =>
    n.folderId === id ? { ...n, folderId: null } : n
  );
  // Move all subfolders to root
  store.folders = store.folders.map((f) =>
    f.parentId === id ? { ...f, parentId: null } : f
  );
  // Delete the folder
  const before = store.folders.length;
  store.folders = store.folders.filter((f) => f.id !== id);
  saveStore(store);
  return store.folders.length < before;
}

// ============================================
// Note CRUD
// ============================================

export function getNotes(folderId: string | null = null): NoteFile[] {
  const store = getStore();
  return store.notes
    .filter((n) => n.folderId === folderId)
    .sort((a, b) => {
      // Pinned first, then by updatedAt
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export function getAllNotes(): NoteFile[] {
  return getStore().notes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getNote(id: string): NoteFile | undefined {
  return getStore().notes.find((n) => n.id === id);
}

export function createNote(
  title: string,
  content = "",
  folderId: string | null = null,
  links: ResourceLink[] = [],
  color = "default"
): NoteFile {
  const store = getStore();
  const now = new Date().toISOString();
  const note: NoteFile = {
    id: crypto.randomUUID(),
    type: "note",
    title,
    content,
    links,
    folderId,
    color,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  store.notes.push(note);
  saveStore(store);
  return note;
}

export function updateNote(
  id: string,
  updates: Partial<
    Pick<NoteFile, "title" | "content" | "links" | "folderId" | "color" | "pinned">
  >
): NoteFile | null {
  const store = getStore();
  const idx = store.notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;

  store.notes[idx] = {
    ...store.notes[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.notes[idx];
}

export function deleteNote(id: string): boolean {
  const store = getStore();
  const before = store.notes.length;
  store.notes = store.notes.filter((n) => n.id !== id);
  saveStore(store);
  return store.notes.length < before;
}

export function moveNoteToFolder(noteId: string, folderId: string | null): boolean {
  const result = updateNote(noteId, { folderId });
  return result !== null;
}

export function togglePin(noteId: string): NoteFile | null {
  const note = getNote(noteId);
  if (!note) return null;
  return updateNote(noteId, { pinned: !note.pinned });
}

/** Add a resource link to a note */
export function addLinkToNote(noteId: string, link: ResourceLink): NoteFile | null {
  const note = getNote(noteId);
  if (!note) return null;
  const exists = note.links.some(
    (l) => l.type === link.type && l.ref === link.ref
  );
  if (exists) return note;
  return updateNote(noteId, { links: [...note.links, link] });
}

/** Remove a resource link from a note */
export function removeLinkFromNote(
  noteId: string,
  linkType: LinkedResourceType,
  linkRef: string
): NoteFile | null {
  const note = getNote(noteId);
  if (!note) return null;
  return updateNote(noteId, {
    links: note.links.filter(
      (l) => !(l.type === linkType && l.ref === linkRef)
    ),
  });
}

// ============================================
// Search
// ============================================

export function searchNotes(query: string): NoteFile[] {
  const q = query.toLowerCase();
  return getAllNotes().filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.links.some((l) => l.ref.toLowerCase().includes(q))
  );
}

// ============================================
// Link Builder Helpers
// ============================================

export function verseLink(
  book: string,
  chapter: number,
  verse: number
): ResourceLink {
  const slug = book.toLowerCase().replace(/\s+/g, "-");
  return {
    type: "verse",
    ref: `${book} ${chapter}:${verse}`,
    href: `/bible/${slug}/${chapter}`,
  };
}

export function strongsLink(strongsNumber: string): ResourceLink {
  return {
    type: "strongs",
    ref: strongsNumber.toUpperCase(),
    href: `/strongs`,
  };
}

export function dictionaryLink(headword: string): ResourceLink {
  return {
    type: "dictionary",
    ref: headword,
    href: `/dictionary`,
  };
}

export function libraryLink(
  bookSlug: string,
  bookTitle: string,
  chapterNumber: number
): ResourceLink {
  return {
    type: "library",
    ref: `${bookTitle} §${chapterNumber}`,
    href: `/library/${bookSlug}`,
  };
}
