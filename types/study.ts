/** Bookmark (localStorage) */
export interface Bookmark {
  id: string;
  verseRef: string; // "Genesis 1:1"
  translationCode: string;
  note: string;
  color: "gold" | "blue" | "green" | "red" | "purple";
  createdAt: string; // ISO date string
}

/** Study note (localStorage) */
export interface StudyNote {
  id: string;
  verseRef?: string;
  bookSlug?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Reading history entry (localStorage) */
export interface HistoryEntry {
  resourceType: "bible" | "library" | "dictionary";
  resourceRef: string; // "genesis:3" or "all-of-grace:5"
  lastReadAt: string;
}

/** Reading plan (localStorage) */
export interface ReadingPlan {
  id: string;
  name: string;
  planData: ReadingPlanDay[];
  currentDay: number;
  startedAt: string;
}

export interface ReadingPlanDay {
  day: number;
  readings: string[]; // ["Genesis 1", "Psalm 1"]
  completed: boolean;
}

/** Memorization card (localStorage) */
export interface MemorizationCard {
  id: string;
  verseRef: string;
  translationCode: string;
  text: string;
  confidence: number; // 0-100 mastery score
  nextReviewAt: string; // ISO date — spaced repetition
  createdAt: string;
}

/** User preferences (localStorage) */
export interface UserPreferences {
  defaultTranslation: string;
  parallelTranslations: string[];
  theme: "light" | "dark" | "system";
}
