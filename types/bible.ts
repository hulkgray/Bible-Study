/** Canonical Bible book info */
export interface BibleBook {
  bookNumber: number;
  name: string;
  slug: string;
  testament: "OT" | "NT";
  chapters: number;
}

/** A single verse in one translation */
export interface Verse {
  id: string;
  book: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  translationCode: string;
  text: string;
}

/** A verse across multiple translations (parallel view) */
export interface ParallelVerse {
  book: string;
  chapter: number;
  verse: number;
  translations: Record<string, string>; // { kjv: "...", asv: "..." }
}

/** Chapter data for the Bible reader */
export interface ChapterData {
  book: string;
  bookNumber: number;
  chapter: number;
  totalChapters: number;
  verses: ParallelVerse[];
}

/** Supported Bible translation */
export interface Translation {
  code: string;
  name: string;
  abbreviation: string;
}

/** Strong's concordance entry */
export interface StrongsEntry {
  id: string;
  strongsNumber: string;
  language: "greek" | "hebrew";
  originalWord: string | null;
  transliteration: string | null;
  pronunciation: string | null;
  definition: string;
}

/** Easton's dictionary entry */
export interface DictionaryEntry {
  id: string;
  headword: string;
  definition: string;
}

/** Library book metadata */
export interface LibraryBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  bookType: "book" | "devotional" | "catechism" | "prayers";
  description: string | null;
}

/** Library chapter content */
export interface LibraryChapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string | null;
  content: string;
}

/** Devotional entry */
export interface DevotionalEntry {
  id: string;
  bookId: string;
  month: number;
  day: number;
  title: string | null;
  scriptureRef: string | null;
  content: string;
}

/** Catechism Q&A entry */
export interface CatechismEntry {
  id: string;
  bookId: string;
  questionNumber: number;
  question: string;
  answer: string;
  scriptureRefs: string[];
}

/** Search result */
export interface SearchResult {
  book: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  translationCode: string;
  text: string;
  /** Highlighted snippet with <mark> tags */
  highlight: string;
}
