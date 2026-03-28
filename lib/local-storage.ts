/**
 * local-storage.ts — Manages all user-specific data in the browser.
 *
 * Since we deferred authentication, all personal data
 * (bookmarks, notes, reading plans) lives in localStorage.
 * Each note/bookmark can link to a specific content resource.
 */

// ============================================
// Types
// ============================================

/** Resource types that notes/bookmarks can link to */
export type LinkedResourceType = "verse" | "dictionary" | "strongs" | "library" | "devotional";

/** A link to a specific resource in the app */
export interface ResourceLink {
  type: LinkedResourceType;
  /** Human-readable reference, e.g. "Genesis 1:1", "G25", "aaron" */
  ref: string;
  /** URL path to navigate to this resource */
  href: string;
}

/** A user note with optional resource links */
export interface StudyNote {
  id: string;
  title: string;
  content: string;
  links: ResourceLink[];
  createdAt: string;
  updatedAt: string;
  color?: string;
}

/** A bookmarked verse */
export interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  translationCode: string;
  text: string;
  createdAt: string;
}

/** User's reading plan progress */
export interface ReadingPlanProgress {
  lastBook: string;
  lastChapter: number;
  completedChapters: string[]; // "genesis-1", "genesis-2", etc.
  startedAt: string;
  updatedAt: string;
}

// ============================================
// Storage Keys
// ============================================
const KEYS = {
  notes: "bible-study-notes",
  bookmarks: "bible-study-bookmarks",
  readingPlan: "bible-study-reading-plan",
  preferences: "bible-study-preferences",
} as const;

// ============================================
// Helpers
// ============================================
function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[Storage] Failed to write:", e);
  }
}

// ============================================
// Notes (with linked resources)
// ============================================
export function getNotes(): StudyNote[] {
  return getStorage<StudyNote[]>(KEYS.notes, []);
}

export function getNote(id: string): StudyNote | undefined {
  return getNotes().find((n) => n.id === id);
}

export function createNote(
  title: string,
  content: string,
  links: ResourceLink[] = [],
  color?: string
): StudyNote {
  const now = new Date().toISOString();
  const note: StudyNote = {
    id: crypto.randomUUID(),
    title,
    content,
    links,
    color,
    createdAt: now,
    updatedAt: now,
  };
  const notes = getNotes();
  notes.unshift(note);
  setStorage(KEYS.notes, notes);
  return note;
}

export function updateNote(
  id: string,
  updates: Partial<Pick<StudyNote, "title" | "content" | "links" | "color">>
): StudyNote | null {
  const notes = getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;

  notes[idx] = {
    ...notes[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setStorage(KEYS.notes, notes);
  return notes[idx];
}

export function deleteNote(id: string): boolean {
  const notes = getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  setStorage(KEYS.notes, filtered);
  return true;
}

/** Add a resource link to an existing note */
export function addLinkToNote(noteId: string, link: ResourceLink): StudyNote | null {
  const note = getNote(noteId);
  if (!note) return null;

  // Avoid duplicate links
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
): StudyNote | null {
  const note = getNote(noteId);
  if (!note) return null;

  return updateNote(noteId, {
    links: note.links.filter(
      (l) => !(l.type === linkType && l.ref === linkRef)
    ),
  });
}

// ============================================
// Link Builder Helpers
// ============================================

/** Build a resource link for a Bible verse */
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

/** Build a resource link for a Strong's entry */
export function strongsLink(strongsNumber: string): ResourceLink {
  return {
    type: "strongs",
    ref: strongsNumber.toUpperCase(),
    href: `/strongs`,
  };
}

/** Build a resource link for a dictionary entry */
export function dictionaryLink(headword: string): ResourceLink {
  return {
    type: "dictionary",
    ref: headword,
    href: `/dictionary`,
  };
}

/** Build a resource link for a library chapter */
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

// ============================================
// Bookmarks
// ============================================
export function getBookmarks(): Bookmark[] {
  return getStorage<Bookmark[]>(KEYS.bookmarks, []);
}

export function addBookmark(
  book: string,
  chapter: number,
  verse: number,
  translationCode: string,
  text: string
): Bookmark {
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    book,
    chapter,
    verse,
    translationCode,
    text,
    createdAt: new Date().toISOString(),
  };
  const bookmarks = getBookmarks();
  bookmarks.unshift(bookmark);
  setStorage(KEYS.bookmarks, bookmarks);
  return bookmark;
}

export function removeBookmark(id: string): boolean {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((b) => b.id !== id);
  if (filtered.length === bookmarks.length) return false;
  setStorage(KEYS.bookmarks, filtered);
  return true;
}

export function isVerseBookmarked(
  book: string,
  chapter: number,
  verse: number
): boolean {
  return getBookmarks().some(
    (b) => b.book === book && b.chapter === chapter && b.verse === verse
  );
}

// ============================================
// Reading Plan
// ============================================
export function getReadingPlan(): ReadingPlanProgress {
  return getStorage<ReadingPlanProgress>(KEYS.readingPlan, {
    lastBook: "genesis",
    lastChapter: 1,
    completedChapters: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function markChapterCompleted(bookSlug: string, chapter: number): void {
  const plan = getReadingPlan();
  const key = `${bookSlug}-${chapter}`;
  if (!plan.completedChapters.includes(key)) {
    plan.completedChapters.push(key);
  }
  plan.lastBook = bookSlug;
  plan.lastChapter = chapter;
  plan.updatedAt = new Date().toISOString();
  setStorage(KEYS.readingPlan, plan);
}

// ============================================
// Preferences
// ============================================
interface Preferences {
  defaultTranslation: string;
  fontSize: "sm" | "base" | "lg" | "xl";
  showVerseNumbers: boolean;
}

export function getPreferences(): Preferences {
  return getStorage<Preferences>(KEYS.preferences, {
    defaultTranslation: "kjv",
    fontSize: "base",
    showVerseNumbers: true,
  });
}

export function updatePreferences(updates: Partial<Preferences>): void {
  const prefs = getPreferences();
  setStorage(KEYS.preferences, { ...prefs, ...updates });
}
