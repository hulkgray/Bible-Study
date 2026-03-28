import type { BibleBook, Translation } from "@/types/bible";

/** All 66 canonical books with chapter counts */
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { bookNumber: 1, name: "Genesis", slug: "genesis", testament: "OT", chapters: 50 },
  { bookNumber: 2, name: "Exodus", slug: "exodus", testament: "OT", chapters: 40 },
  { bookNumber: 3, name: "Leviticus", slug: "leviticus", testament: "OT", chapters: 27 },
  { bookNumber: 4, name: "Numbers", slug: "numbers", testament: "OT", chapters: 36 },
  { bookNumber: 5, name: "Deuteronomy", slug: "deuteronomy", testament: "OT", chapters: 34 },
  { bookNumber: 6, name: "Joshua", slug: "joshua", testament: "OT", chapters: 24 },
  { bookNumber: 7, name: "Judges", slug: "judges", testament: "OT", chapters: 21 },
  { bookNumber: 8, name: "Ruth", slug: "ruth", testament: "OT", chapters: 4 },
  { bookNumber: 9, name: "1 Samuel", slug: "1-samuel", testament: "OT", chapters: 31 },
  { bookNumber: 10, name: "2 Samuel", slug: "2-samuel", testament: "OT", chapters: 24 },
  { bookNumber: 11, name: "1 Kings", slug: "1-kings", testament: "OT", chapters: 22 },
  { bookNumber: 12, name: "2 Kings", slug: "2-kings", testament: "OT", chapters: 25 },
  { bookNumber: 13, name: "1 Chronicles", slug: "1-chronicles", testament: "OT", chapters: 29 },
  { bookNumber: 14, name: "2 Chronicles", slug: "2-chronicles", testament: "OT", chapters: 36 },
  { bookNumber: 15, name: "Ezra", slug: "ezra", testament: "OT", chapters: 10 },
  { bookNumber: 16, name: "Nehemiah", slug: "nehemiah", testament: "OT", chapters: 13 },
  { bookNumber: 17, name: "Esther", slug: "esther", testament: "OT", chapters: 10 },
  { bookNumber: 18, name: "Job", slug: "job", testament: "OT", chapters: 42 },
  { bookNumber: 19, name: "Psalms", slug: "psalms", testament: "OT", chapters: 150 },
  { bookNumber: 20, name: "Proverbs", slug: "proverbs", testament: "OT", chapters: 31 },
  { bookNumber: 21, name: "Ecclesiastes", slug: "ecclesiastes", testament: "OT", chapters: 12 },
  { bookNumber: 22, name: "Song of Solomon", slug: "song-of-solomon", testament: "OT", chapters: 8 },
  { bookNumber: 23, name: "Isaiah", slug: "isaiah", testament: "OT", chapters: 66 },
  { bookNumber: 24, name: "Jeremiah", slug: "jeremiah", testament: "OT", chapters: 52 },
  { bookNumber: 25, name: "Lamentations", slug: "lamentations", testament: "OT", chapters: 5 },
  { bookNumber: 26, name: "Ezekiel", slug: "ezekiel", testament: "OT", chapters: 48 },
  { bookNumber: 27, name: "Daniel", slug: "daniel", testament: "OT", chapters: 12 },
  { bookNumber: 28, name: "Hosea", slug: "hosea", testament: "OT", chapters: 14 },
  { bookNumber: 29, name: "Joel", slug: "joel", testament: "OT", chapters: 3 },
  { bookNumber: 30, name: "Amos", slug: "amos", testament: "OT", chapters: 9 },
  { bookNumber: 31, name: "Obadiah", slug: "obadiah", testament: "OT", chapters: 1 },
  { bookNumber: 32, name: "Jonah", slug: "jonah", testament: "OT", chapters: 4 },
  { bookNumber: 33, name: "Micah", slug: "micah", testament: "OT", chapters: 7 },
  { bookNumber: 34, name: "Nahum", slug: "nahum", testament: "OT", chapters: 3 },
  { bookNumber: 35, name: "Habakkuk", slug: "habakkuk", testament: "OT", chapters: 3 },
  { bookNumber: 36, name: "Zephaniah", slug: "zephaniah", testament: "OT", chapters: 3 },
  { bookNumber: 37, name: "Haggai", slug: "haggai", testament: "OT", chapters: 2 },
  { bookNumber: 38, name: "Zechariah", slug: "zechariah", testament: "OT", chapters: 14 },
  { bookNumber: 39, name: "Malachi", slug: "malachi", testament: "OT", chapters: 4 },
  // New Testament
  { bookNumber: 40, name: "Matthew", slug: "matthew", testament: "NT", chapters: 28 },
  { bookNumber: 41, name: "Mark", slug: "mark", testament: "NT", chapters: 16 },
  { bookNumber: 42, name: "Luke", slug: "luke", testament: "NT", chapters: 24 },
  { bookNumber: 43, name: "John", slug: "john", testament: "NT", chapters: 21 },
  { bookNumber: 44, name: "Acts", slug: "acts", testament: "NT", chapters: 28 },
  { bookNumber: 45, name: "Romans", slug: "romans", testament: "NT", chapters: 16 },
  { bookNumber: 46, name: "1 Corinthians", slug: "1-corinthians", testament: "NT", chapters: 16 },
  { bookNumber: 47, name: "2 Corinthians", slug: "2-corinthians", testament: "NT", chapters: 13 },
  { bookNumber: 48, name: "Galatians", slug: "galatians", testament: "NT", chapters: 6 },
  { bookNumber: 49, name: "Ephesians", slug: "ephesians", testament: "NT", chapters: 6 },
  { bookNumber: 50, name: "Philippians", slug: "philippians", testament: "NT", chapters: 4 },
  { bookNumber: 51, name: "Colossians", slug: "colossians", testament: "NT", chapters: 4 },
  { bookNumber: 52, name: "1 Thessalonians", slug: "1-thessalonians", testament: "NT", chapters: 5 },
  { bookNumber: 53, name: "2 Thessalonians", slug: "2-thessalonians", testament: "NT", chapters: 3 },
  { bookNumber: 54, name: "1 Timothy", slug: "1-timothy", testament: "NT", chapters: 6 },
  { bookNumber: 55, name: "2 Timothy", slug: "2-timothy", testament: "NT", chapters: 4 },
  { bookNumber: 56, name: "Titus", slug: "titus", testament: "NT", chapters: 3 },
  { bookNumber: 57, name: "Philemon", slug: "philemon", testament: "NT", chapters: 1 },
  { bookNumber: 58, name: "Hebrews", slug: "hebrews", testament: "NT", chapters: 13 },
  { bookNumber: 59, name: "James", slug: "james", testament: "NT", chapters: 5 },
  { bookNumber: 60, name: "1 Peter", slug: "1-peter", testament: "NT", chapters: 5 },
  { bookNumber: 61, name: "2 Peter", slug: "2-peter", testament: "NT", chapters: 3 },
  { bookNumber: 62, name: "1 John", slug: "1-john", testament: "NT", chapters: 5 },
  { bookNumber: 63, name: "2 John", slug: "2-john", testament: "NT", chapters: 1 },
  { bookNumber: 64, name: "3 John", slug: "3-john", testament: "NT", chapters: 1 },
  { bookNumber: 65, name: "Jude", slug: "jude", testament: "NT", chapters: 1 },
  { bookNumber: 66, name: "Revelation", slug: "revelation", testament: "NT", chapters: 22 },
];

/** All 10 supported translations from bibles.xlsx */
export const TRANSLATIONS: Translation[] = [
  { code: "kjv", name: "King James Bible", abbreviation: "KJV" },
  { code: "asv", name: "American Standard Version", abbreviation: "ASV" },
  { code: "drb", name: "Douay-Rheims Bible", abbreviation: "DRB" },
  { code: "dbt", name: "Darby Bible Translation", abbreviation: "DBT" },
  { code: "erv", name: "English Revised Version", abbreviation: "ERV" },
  { code: "wbt", name: "Webster Bible Translation", abbreviation: "WBT" },
  { code: "web", name: "World English Bible", abbreviation: "WEB" },
  { code: "ylt", name: "Young's Literal Translation", abbreviation: "YLT" },
  { code: "akjv", name: "American King James Version", abbreviation: "AKJV" },
  { code: "wnt", name: "Weymouth New Testament", abbreviation: "WNT" },
];

/** Map column index (from XLSX) to translation code */
export const COLUMN_TO_TRANSLATION: Record<number, string> = {
  1: "kjv",
  2: "asv",
  3: "drb",
  4: "dbt",
  5: "erv",
  6: "wbt",
  7: "web",
  8: "ylt",
  9: "akjv",
  10: "wnt",
};

/** Helper: find a book by its slug */
export function getBookBySlug(slug: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.slug === slug);
}

/** Helper: find a book by its name (case-insensitive) */
export function getBookByName(name: string): BibleBook | undefined {
  const normalized = name.toLowerCase().trim();
  return BIBLE_BOOKS.find((b) => b.name.toLowerCase() === normalized);
}
